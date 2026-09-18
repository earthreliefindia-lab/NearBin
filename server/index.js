require('dotenv').config(); // Load .env before anything else
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDatabase, getAdapter, getDistanceMeters } = require('./db');

// ─── Security Middleware ────────────────────────────────────────────────────
let helmet, rateLimit;
try { helmet = require('helmet'); } catch (e) { helmet = null; }
try { rateLimit = require('express-rate-limit'); } catch (e) { rateLimit = null; }

const app = express();
const PORT = process.env.PORT || 3001;
const distPath = path.join(__dirname, '..', 'dist');

// Serve compiled PWA frontend
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// ─── Helmet Security Headers ────────────────────────────────────────────────
if (helmet) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https:'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
} else {
  // Fallback manual security headers if helmet not installed yet
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
}

// ─── CORS Hardening ─────────────────────────────────────────────────────────
const allowedOrigins = [
  'https://earthrelief.in',
  'https://www.earthrelief.in',
  'https://nearbin.agriheal.in',
  'https://agriheal.in',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8081',
  'http://localhost:19006',
];

app.use(cors({
  origin: (origin, callback) => {
    // Native mobile apps (React Native / Android APK) and curl send no origin header
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.earthrelief.in') || origin.endsWith('.agriheal.in')) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy violation'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ─── Body Parser with Strict Size Limit ────────────────────────────────────
app.use(express.json({ limit: '12mb' }));

// ─── Rate Limiters ──────────────────────────────────────────────────────────
const reportLimiter = rateLimit ? rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // Max 20 new reports per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many reports submitted. Please try again in 15 minutes.' },
  skip: (req) => !req.ip || req.ip === '127.0.0.1' || req.ip === '::1',
}) : (req, res, next) => next();

const upvoteLimiter = rateLimit ? rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many votes. Please slow down.' },
}) : (req, res, next) => next();

const globalLimiter = rateLimit ? rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120,                  // 120 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Rate limit exceeded. Please slow down.' },
}) : (req, res, next) => next();

app.use('/api/', globalLimiter);

// ─── Input Validation Helpers ───────────────────────────────────────────────
function isValidLatitude(v)  { const n = parseFloat(v); return !isNaN(n) && n >= -90  && n <= 90; }
function isValidLongitude(v) { const n = parseFloat(v); return !isNaN(n) && n >= -180 && n <= 180; }
function sanitizeString(s, maxLen = 500) {
  if (typeof s !== 'string') return '';
  return s.trim().slice(0, maxLen).replace(/[<>]/g, '');
}

// ─── Active SSE Clients ─────────────────────────────────────────────────────
const sseClients = new Set();

/**
 * Broadcasts a real-time update to all connected SSE clients.
 * eventRole: 'all' | 'worker' | 'scrap_picker'
 */
function broadcastUpdate(eventData = { type: 'hotspots_updated' }, eventRole = 'all') {
  const payload = `data: ${JSON.stringify({ ...eventData, targetRole: eventRole })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (e) {
      sseClients.delete(client);
    }
  }
  console.log(`[SSE] Broadcast → ${sseClients.size} clients | role=${eventRole} | type=${eventData.type}`);
}

// ─── GET /api/events — Realtime SSE Stream ──────────────────────────────────
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders?.();

  // Send initial handshake
  res.write(`data: ${JSON.stringify({ type: 'connected', time: Date.now(), clients: sseClients.size + 1 })}\n\n`);
  sseClients.add(res);
  console.log(`[SSE] Client connected. Total: ${sseClients.size}`);

  req.on('close', () => {
    sseClients.delete(res);
    console.log(`[SSE] Client disconnected. Total: ${sseClients.size}`);
  });
});

// Periodic keepalive to prevent proxy timeouts
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': keepalive\n\n');
    } catch (e) {
      sseClients.delete(client);
    }
  }
}, 25000);

// ─── GET /api/hotspots ──────────────────────────────────────────────────────
app.get('/api/hotspots', async (req, res) => {
  try {
    const db = getAdapter();
    const { category, status, lat, lng, radiusKm, recyclablesOnly } = req.query;

    // Validate lat/lng if provided
    if (lat && !isValidLatitude(lat))  return res.status(400).json({ success: false, message: 'Invalid latitude.' });
    if (lng && !isValidLongitude(lng)) return res.status(400).json({ success: false, message: 'Invalid longitude.' });

    const hotspots = await db.getHotspots({ category, status, lat, lng, radiusKm, recyclablesOnly });
    res.json({ success: true, total: hotspots.length, hotspots });
  } catch (err) {
    console.error('[API] /hotspots error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── GET /api/stats ─────────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const db = getAdapter();
    const list = await db.getHotspots();
    const total = list.length;
    const cleaned = list.filter(h => h.status === 'cleaned').length;
    const inProgress = list.filter(h => h.status === 'in_progress').length;
    const reported = list.filter(h => h.status === 'reported').length;
    const recyclables = list.filter(h => ['plastic', 'scrap'].includes((h.category || '').toLowerCase())).length;

    res.json({
      success: true,
      stats: {
        totalSpots: total,
        cleanedSpots: cleaned,
        inProgressSpots: inProgress,
        pendingSpots: reported,
        recyclablesDiverted: recyclables,
        cleanRatePercentage: total > 0 ? Math.round((cleaned / total) * 100) : 0,
        activeSseClients: sseClients.size,
      }
    });
  } catch (err) {
    console.error('[API] /stats error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── POST /api/reports — Citizen Report with Anti-Duplicate + Rate Limit ────
app.post('/api/reports', reportLimiter, async (req, res) => {
  try {
    const db = getAdapter();
    const reportData = req.body || {};
    const { title, description, category, latitude, longitude, address, beforePhoto, reportedBy } = reportData;

    // ── Strict Input Validation ──────────────────────────────────────────────
    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude are required GPS coordinates.' });
    }
    if (!isValidLatitude(latitude)) {
      return res.status(400).json({ success: false, message: 'Invalid latitude value.' });
    }
    if (!isValidLongitude(longitude)) {
      return res.status(400).json({ success: false, message: 'Invalid longitude value.' });
    }
    // Block excessively large base64 photos (> 8MB)
    if (beforePhoto && beforePhoto.startsWith('data:') && beforePhoto.length > 8 * 1024 * 1024) {
      return res.status(413).json({ success: false, message: 'Photo is too large. Please compress before uploading.' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const safeTitle = sanitizeString(title, 200);
    const safeDesc  = sanitizeString(description, 1000);
    const safeAddr  = sanitizeString(address, 300);
    const safeBy    = sanitizeString(reportedBy, 100);

    // ── Anti-Spam / Duplicate Check ──────────────────────────────────────────
    const existingNearby = await db.findNearby(lat, lng, 25);
    if (existingNearby) {
      if (beforePhoto) {
        if (!Array.isArray(existingNearby.photos)) {
          existingNearby.photos = existingNearby.beforePhoto ? [
            {
              id: `p-${Date.now()}-0`,
              uri: existingNearby.beforePhoto,
              reportedBy: existingNearby.reportedBy || 'Concerned Citizen',
              reportedAt: existingNearby.reportedAt || new Date().toISOString(),
              caption: existingNearby.title || 'Initial garbage spot'
            }
          ] : [];
        }
        existingNearby.photos.push({
          id: `p-${Date.now()}`,
          uri: beforePhoto,
          reportedBy: safeBy || 'Concerned Citizen',
          reportedAt: new Date().toISOString(),
          caption: safeDesc || safeTitle || 'Live status photo update'
        });
      }
      await db.upvoteHotspot(existingNearby.id, safeBy);
      db.saveHotspots?.();
      // Broadcast to ALL roles — new photo added to existing spot
      broadcastUpdate({
        type: 'hotspots_updated',
        action: 'report_merged',
        hotspotId: existingNearby.id,
        category: existingNearby.category,
      }, 'all');
      return res.json({
        success: true,
        merged: true,
        message: 'A report already exists at this spot! Added to the Live Status photos of this spot (+1 Upvote).',
        hotspot: existingNearby
      });
    }

    // ── Create New Hotspot Report ────────────────────────────────────────────
    const newReport = {
      id: reportData.id || `nb-${Date.now().toString(36)}`,
      title: safeTitle || `${(category || 'Waste').toUpperCase()} Dump Reported`,
      description: safeDesc || 'Reported by citizen via live camera capture.',
      category: sanitizeString(category || 'plastic', 50).toLowerCase(),
      status: reportData.status || 'reported',
      urgency: reportData.urgency || 'medium',
      upvotes: 1,
      voters: safeBy ? [safeBy] : [],
      latitude: lat,
      longitude: lng,
      address: safeAddr || 'Coordinates verified on Mappls',
      beforePhoto: beforePhoto || 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600&auto=format&fit=crop&q=80',
      afterPhoto: null,
      photos: reportData.photos && reportData.photos.length > 0 ? reportData.photos : (beforePhoto ? [
        {
          id: `p-${Date.now()}`,
          uri: beforePhoto,
          reportedBy: safeBy || 'Concerned Citizen',
          reportedAt: new Date().toISOString(),
          caption: safeTitle || 'Garbage spot reported'
        }
      ] : []),
      reportedBy: safeBy || 'Concerned Citizen',
      reportedAt: reportData.reportedAt || new Date().toISOString(),
      characterCount: reportData.characterCount || 0,
      notesKarma: reportData.notesKarma || 0,
      karmaAwarded: reportData.karmaAwarded || 50,
      cleanedAt: null,
      cleanedBy: null,
      claimedBy: null
    };

    const created = await db.createHotspot(newReport);

    // Broadcast to govt workers AND recyclers immediately
    const isRecyclable = ['plastic', 'scrap'].includes(newReport.category);
    broadcastUpdate({
      type: 'hotspots_updated',
      action: 'report_created',
      hotspot: created,
      category: created.category,
    }, 'all');

    // If recyclable, send extra targeted event for scrap pickers
    if (isRecyclable) {
      broadcastUpdate({
        type: 'recyclable_added',
        action: 'report_created',
        hotspotId: created.id,
        category: created.category,
        latitude: created.latitude,
        longitude: created.longitude,
      }, 'scrap_picker');
    }

    res.status(201).json({
      success: true,
      merged: false,
      message: 'Report logged successfully! Hotspot added to live map.',
      hotspot: created
    });
  } catch (err) {
    console.error('[API] /reports error:', err);
    res.status(500).json({ success: false, message: 'Failed to create report' });
  }
});

// ─── POST /api/reports/:id/upvote ───────────────────────────────────────────
app.post('/api/reports/:id/upvote', upvoteLimiter, async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const { voterId } = req.body || {};
    const result = await db.upvoteHotspot(id, sanitizeString(voterId, 100));

    if (!result || !result.hotspot) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    if (result.alreadyVoted) {
      return res.json({ success: false, alreadyVoted: true, message: 'You have already voted for this spot.', hotspot: result.hotspot });
    }

    broadcastUpdate({ type: 'hotspots_updated', action: 'upvoted', hotspotId: id }, 'all');
    res.json({ success: true, alreadyVoted: false, message: 'Upvoted! Priority boosted on the live heatmap.', hotspot: result.hotspot });
  } catch (err) {
    console.error('[API] /upvote error:', err);
    res.status(500).json({ success: false, message: 'Failed to upvote report' });
  }
});

// ─── POST /api/reports/:id/status — Govt Worker Updates Status ──────────────
app.post('/api/reports/:id/status', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const { status, cleanedBy, afterPhoto } = req.body;

    const allowedStatuses = ['reported', 'in_progress', 'cleaned', 'recycled_picked_up'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
    }

    const item = await db.updateHotspotStatus(id, {
      status,
      cleanedBy: sanitizeString(cleanedBy, 100),
      afterPhoto
    });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    broadcastUpdate({ type: 'hotspots_updated', action: 'status_updated', hotspotId: id, status }, 'all');
    res.json({ success: true, message: `Status updated to ${status}!`, hotspot: item });
  } catch (err) {
    console.error('[API] /status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

// ─── POST /api/reports/:id/claim — Recycler Claims Recyclables ──────────────
app.post('/api/reports/:id/claim', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const { claimedBy } = req.body;

    const item = await db.claimHotspot(id, sanitizeString(claimedBy, 100));
    if (!item) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    broadcastUpdate({ type: 'hotspots_updated', action: 'claimed', hotspotId: id }, 'scrap_picker');
    res.json({ success: true, message: 'Recyclables claimed for collection!', hotspot: item });
  } catch (err) {
    console.error('[API] /claim error:', err);
    res.status(500).json({ success: false, message: 'Failed to claim recyclables' });
  }
});

// ─── POST /api/user/profile ─────────────────────────────────────────────────
app.post('/api/user/profile', async (req, res) => {
  try {
    const db = getAdapter();
    const userData = req.body;
    if (!userData || !userData.id) {
      return res.status(400).json({ success: false, message: 'User id is required' });
    }
    // Sanitize user data
    const safeUser = {
      ...userData,
      name: sanitizeString(userData.name, 100),
      email: sanitizeString(userData.email, 200),
      avatar: typeof userData.avatar === 'string' ? userData.avatar.slice(0, 500) : undefined,
    };

    const updatedUser = await db.upsertUserProfile(safeUser);
    console.log(`[NearBin Server] Profile updated for ${userData.id} (${userData.name})`);
    res.json({ success: true, message: 'Profile synced to server successfully', user: updatedUser });
  } catch (err) {
    console.error('[API] /user/profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to sync profile' });
  }
});

// ─── GET /api/user/profile/:id ──────────────────────────────────────────────
app.get('/api/user/profile/:id', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    if (!id || id.length > 200) {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }
    const user = await db.getUserProfile(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found on server' });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error('[API] /user/profile/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
  }
});

// ─── GET /api/health ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const db = getAdapter();
  res.json({
    status: 'ok',
    service: 'NearBin Production API',
    version: '2.0.0',
    storageEngine: db ? db.name : 'initializing',
    uptimeSeconds: Math.round(process.uptime()),
    activeSseClients: sseClients.size,
    timestamp: new Date().toISOString()
  });
});

// ─── SPA Fallback ─────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  const indexHtml = path.join(distPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    return res.sendFile(indexHtml);
  }
  res.send('NearBin API Server is running. Run npm run build:web to build the frontend.');
});

// ─── Start Server ─────────────────────────────────────────────────────────────
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NearBin Server] ✅ Running on http://0.0.0.0:${PORT}`);
    console.log(`[NearBin Server] Security: Helmet=${!!helmet}, RateLimit=${!!rateLimit}`);
  });
}).catch(err => {
  console.error('[NearBin Server] Fatal initialization error:', err);
  process.exit(1);
});
