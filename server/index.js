const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, 'database.json');
const USERS_DB_PATH = path.join(__dirname, 'users.json');

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Helper: Read database
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return [];
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading DB:', err);
    return [];
  }
}

// Helper: Write database
function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// Helper: Read users database
function readUsersDB() {
  try {
    if (!fs.existsSync(USERS_DB_PATH)) {
      return {};
    }
    const data = fs.readFileSync(USERS_DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading users DB:', err);
    return {};
  }
}

// Helper: Write users database
function writeUsersDB(data) {
  try {
    fs.writeFileSync(USERS_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing users DB:', err);
  }
}

// Helper: Calculate distance in meters between two lat/lng pairs (Haversine formula)
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// GET /api/hotspots - Retrieve hotspots with filters and distance
app.get('/api/hotspots', (req, res) => {
  const { category, status, lat, lng, radiusKm, recyclablesOnly } = req.query;
  let hotspots = readDB();

  if (category && category !== 'all') {
    hotspots = hotspots.filter(h => h.category.toLowerCase() === category.toLowerCase());
  }

  if (status && status !== 'all') {
    hotspots = hotspots.filter(h => h.status.toLowerCase() === status.toLowerCase());
  }

  if (recyclablesOnly === 'true') {
    hotspots = hotspots.filter(h => ['plastic', 'scrap'].includes(h.category.toLowerCase()) && h.status !== 'cleaned');
  }

  // Calculate distance if user lat/lng provided
  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    hotspots = hotspots.map(h => {
      const distance = getDistanceMeters(userLat, userLng, h.latitude, h.longitude);
      return { ...h, distanceMeters: Math.round(distance) };
    });

    if (radiusKm) {
      const radiusMeters = parseFloat(radiusKm) * 1000;
      hotspots = hotspots.filter(h => h.distanceMeters <= radiusMeters);
    }

    hotspots.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
  }

  res.json({
    success: true,
    total: hotspots.length,
    hotspots
  });
});

// POST /api/reports - Citizen report with anti-duplicate merging
app.post('/api/reports', (req, res) => {
  const { title, description, category, latitude, longitude, address, beforePhoto, reportedBy } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ success: false, message: 'Latitude and Longitude are required GPS coordinates.' });
  }

  const hotspots = readDB();
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  // Anti-Spam / Duplicate Check: check if another active report exists within 25 meters
  const existingNearby = hotspots.find(h => {
    if (h.status === 'cleaned') return false;
    const dist = getDistanceMeters(lat, lng, h.latitude, h.longitude);
    return dist <= 25; // 25 meters radius threshold
  });

  if (existingNearby) {
    // Merge into existing report: increase upvotes and boost urgency
    existingNearby.upvotes = (existingNearby.upvotes || 1) + 1;
    if (existingNearby.upvotes >= 5 && existingNearby.urgency === 'low') {
      existingNearby.urgency = 'medium';
    } else if (existingNearby.upvotes >= 10 && existingNearby.urgency === 'medium') {
      existingNearby.urgency = 'high';
    } else if (existingNearby.upvotes >= 20) {
      existingNearby.urgency = 'critical';
    }

    writeDB(hotspots);

    return res.json({
      success: true,
      merged: true,
      message: 'A report already exists at this spot! Your upload has been recorded as a High-Priority Upvote (+1).',
      hotspot: existingNearby
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
    reportedBy: reportedBy || 'Concerned Citizen',
    reportedAt: new Date().toISOString(),
    cleanedAt: null,
    cleanedBy: null,
    claimedBy: null
  };

  hotspots.unshift(newReport);
  writeDB(hotspots);

  res.status(201).json({
    success: true,
    merged: false,
    message: 'Report logged successfully! Hotspot added to live map.',
    hotspot: newReport
  });
});

// POST /api/reports/:id/upvote - Citizen confirms presence of garbage
app.post('/api/reports/:id/upvote', (req, res) => {
  const { id } = req.params;
  const hotspots = readDB();
  const item = hotspots.find(h => h.id === id);

  if (!item) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }

  item.upvotes = (item.upvotes || 0) + 1;
  if (item.upvotes >= 15) item.urgency = 'critical';
  else if (item.upvotes >= 8) item.urgency = 'high';

  writeDB(hotspots);
  res.json({ success: true, message: 'Upvoted! Priority boosted on the live heatmap.', hotspot: item });
});

// POST /api/reports/:id/status - Municipal / Govt Worker updates status
app.post('/api/reports/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, cleanedBy, afterPhoto } = req.body;
  const hotspots = readDB();
  const item = hotspots.find(h => h.id === id);

  if (!item) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }

  if (status === 'cleaned') {
    item.status = 'cleaned';
    item.cleanedAt = new Date().toISOString();
    item.cleanedBy = cleanedBy || 'Govt Safai Mitra Squad';
    item.afterPhoto = afterPhoto || 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&auto=format&fit=crop&q=80';
    item.urgency = 'low';
  } else if (status === 'in_progress') {
    item.status = 'in_progress';
    item.cleanedBy = cleanedBy || 'Govt Safai Mitra Squad';
  }

  writeDB(hotspots);
  res.json({ success: true, message: `Status updated to ${status}!`, hotspot: item });
});

// POST /api/reports/:id/claim - Kabadiwala / Scrap picker claims recyclables
app.post('/api/reports/:id/claim', (req, res) => {
  const { id } = req.params;
  const { claimedBy } = req.body;
  const hotspots = readDB();
  const item = hotspots.find(h => h.id === id);

  if (!item) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }

  item.claimedBy = claimedBy || 'Local Scrap Collector';
  writeDB(hotspots);
  res.json({ success: true, message: 'Recyclables claimed for collection!', hotspot: item });
});

// GET /api/stats - High-level analytics
app.get('/api/stats', (req, res) => {
  const hotspots = readDB();
  const total = hotspots.length;
  const cleaned = hotspots.filter(h => h.status === 'cleaned').length;
  const inProgress = hotspots.filter(h => h.status === 'in_progress').length;
  const reported = hotspots.filter(h => h.status === 'reported').length;
  const recyclables = hotspots.filter(h => ['plastic', 'scrap'].includes(h.category)).length;

  res.json({
    success: true,
    stats: {
      totalSpots: total,
      cleanedSpots: cleaned,
      inProgressSpots: inProgress,
      pendingSpots: reported,
      recyclablesDiverted: recyclables,
      cleanRatePercentage: total > 0 ? Math.round((cleaned / total) * 100) : 0
    }
  });
});

// GET /api/health - Cloud service health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'NearBin Backend API',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// POST /api/user/profile - Create or Update User Profile instantly on server
app.post('/api/user/profile', (req, res) => {
  const userData = req.body;
  if (!userData || !userData.id) {
    return res.status(400).json({ success: false, message: 'User id is required' });
  }

  const users = readUsersDB();
  const existing = users[userData.id] || {};
  const updatedUser = {
    ...existing,
    ...userData,
    updatedAt: new Date().toISOString(),
  };

  users[userData.id] = updatedUser;
  writeUsersDB(users);

  console.log(`[NearBin Server] Profile updated instantly for ${userData.id} (${userData.name})`);
  res.json({ success: true, message: 'Profile synced to server successfully', user: updatedUser });
});

// GET /api/user/profile/:id - Instant fetch of user profile from server
app.get('/api/user/profile/:id', (req, res) => {
  const { id } = req.params;
  const users = readUsersDB();
  const user = users[id];

  if (!user) {
    return res.status(404).json({ success: false, message: 'User profile not found on server' });
  }

  res.json({ success: true, user });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[NearBin Server] Running on http://0.0.0.0:${PORT}`);
});
