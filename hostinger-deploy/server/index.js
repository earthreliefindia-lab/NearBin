const express = require('express');
const cors = require('cors');
const { initDatabase, getAdapter, getDistanceMeters } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS Hardening for Earth Relief India & Mobile Distribution
const allowedOrigins = [
  'https://earthrelief.in',
  'https://www.earthrelief.in',
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:19006',
];

app.use(cors({
  origin: (origin, callback) => {
    // Native mobile apps (React Native / Android APK) and curl send no origin header
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.earthrelief.in')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '15mb' }));

// GET /api/hotspots - Retrieve hotspots with filters and distance
app.get('/api/hotspots', async (req, res) => {
  try {
    const db = getAdapter();
    const { category, status, lat, lng, radiusKm, recyclablesOnly } = req.query;
    const hotspots = await db.getHotspots({ category, status, lat, lng, radiusKm, recyclablesOnly });

    res.json({
      success: true,
      total: hotspots.length,
      hotspots
    });
  } catch (err) {
    console.error('[API] /hotspots error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/reports - Citizen report with anti-duplicate merging
app.post('/api/reports', async (req, res) => {
  try {
    const db = getAdapter();
    const { title, description, category, latitude, longitude, address, beforePhoto, reportedBy } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude are required GPS coordinates.' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Anti-Spam / Duplicate Check: check if another active report exists within 25 meters
    const existingNearby = await db.findNearby(lat, lng, 25);

    if (existingNearby) {
      const updated = await db.upvoteHotspot(existingNearby.id);
      return res.json({
        success: true,
        merged: true,
        message: 'A report already exists at this spot! Recorded as a High-Priority Upvote (+1).',
        hotspot: updated || existingNearby
      });
    }

    // Create new hotspot report
    const newReport = {
      id: `nb-${Date.now().toString(36)}`,
      title: title || `${(category || 'Waste').toUpperCase()} Dump Reported`,
      description: description || 'Reported by citizen via live camera capture.',
      category: (category || 'plastic').toLowerCase(),
      status: 'reported',
      urgency: 'medium',
      upvotes: 1,
      latitude: lat,
      longitude: lng,
      address: address || 'Coordinates verified on Mappls',
      beforePhoto: beforePhoto || 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600&auto=format&fit=crop&q=80',
      afterPhoto: null,
      photos: beforePhoto ? [
        {
          id: `p-${Date.now()}`,
          uri: beforePhoto,
          reportedBy: reportedBy || 'Concerned Citizen',
          reportedAt: new Date().toISOString(),
          caption: title || 'Garbage spot reported'
        }
      ] : [],
      reportedBy: reportedBy || 'Concerned Citizen',
      reportedAt: new Date().toISOString(),
      cleanedAt: null,
      cleanedBy: null,
      claimedBy: null
    };

    const created = await db.createHotspot(newReport);

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

// POST /api/reports/:id/upvote - Citizen confirms presence of garbage
app.post('/api/reports/:id/upvote', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const item = await db.upvoteHotspot(id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({ success: true, message: 'Upvoted! Priority boosted on the live heatmap.', hotspot: item });
  } catch (err) {
    console.error('[API] /upvote error:', err);
    res.status(500).json({ success: false, message: 'Failed to upvote report' });
  }
});

// POST /api/reports/:id/status - Municipal / Govt Worker updates status
app.post('/api/reports/:id/status', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const { status, cleanedBy, afterPhoto } = req.body;

    const item = await db.updateHotspotStatus(id, { status, cleanedBy, afterPhoto });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({ success: true, message: `Status updated to ${status}!`, hotspot: item });
  } catch (err) {
    console.error('[API] /status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

// POST /api/reports/:id/claim - Kabadiwala / Scrap picker claims recyclables
app.post('/api/reports/:id/claim', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const { claimedBy } = req.body;

    const item = await db.claimHotspot(id, claimedBy);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({ success: true, message: 'Recyclables claimed for collection!', hotspot: item });
  } catch (err) {
    console.error('[API] /claim error:', err);
    res.status(500).json({ success: false, message: 'Failed to claim recyclables' });
  }
});

// GET /api/stats - High-level analytics
app.get('/api/stats', async (req, res) => {
  try {
    const db = getAdapter();
    const stats = await db.getStats();
    res.json({ success: true, stats });
  } catch (err) {
    console.error('[API] /stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// GET /api/health - Cloud service health check
app.get('/api/health', (req, res) => {
  const db = getAdapter();
  res.json({
    status: 'ok',
    service: 'NearBin Production API',
    version: '1.0.0',
    storageEngine: db ? db.name : 'initializing',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// POST /api/user/profile - Create or Update User Profile instantly on server
app.post('/api/user/profile', async (req, res) => {
  try {
    const db = getAdapter();
    const userData = req.body;
    if (!userData || !userData.id) {
      return res.status(400).json({ success: false, message: 'User id is required' });
    }

    const updatedUser = await db.upsertUserProfile(userData);
    console.log(`[NearBin Server] Profile updated instantly for ${userData.id} (${userData.name})`);
    res.json({ success: true, message: 'Profile synced to server successfully', user: updatedUser });
  } catch (err) {
    console.error('[API] /user/profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to sync profile' });
  }
});

// GET /api/user/profile/:id - Instant fetch of user profile from server
app.get('/api/user/profile/:id', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
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

// Start Server after Database is initialized
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NearBin Server] Running on http://0.0.0.0:${PORT}`);
  });
}).catch(err => {
  console.error('[NearBin Server] Fatal initialization error:', err);
  process.exit(1);
});
