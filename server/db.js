const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.json');
const USERS_DB_PATH = path.join(__dirname, 'users.json');
const DATABASE_URL = process.env.DATABASE_URL;

// Haversine Distance in meters
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
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

// -------------------------------------------------------------
// Storage Adapter Interface
// -------------------------------------------------------------
let dbAdapter = null;

// File-based Atomic Store (Fallback & Local Persistence)
class FileStorageAdapter {
  constructor() {
    this.name = 'file_json';
    this.hotspots = [];
    this.users = {};
  }

  async init() {
    // Read or seed hotspots
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf8');
        this.hotspots = JSON.parse(raw);
      } else {
        this.hotspots = [];
        this.saveHotspots();
      }
    } catch (e) {
      console.warn('[DB] Error loading database.json, initializing empty list:', e?.message);
      this.hotspots = [];
    }

    // Read or seed users
    try {
      if (fs.existsSync(USERS_DB_PATH)) {
        const raw = fs.readFileSync(USERS_DB_PATH, 'utf8');
        this.users = JSON.parse(raw);
      } else {
        this.users = {};
        this.saveUsers();
      }
    } catch (e) {
      console.warn('[DB] Error loading users.json, initializing empty dict:', e?.message);
      this.users = {};
    }

    console.log(`[DB] FileStorageAdapter ready. Loaded ${this.hotspots.length} hotspots, ${Object.keys(this.users).length} users.`);
    return true;
  }

  saveHotspots() {
    try {
      const tempPath = `${DB_PATH}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.hotspots, null, 2), 'utf8');
      fs.renameSync(tempPath, DB_PATH);
    } catch (err) {
      console.error('[DB] Atomic write error on hotspots:', err);
    }
  }

  saveUsers() {
    try {
      const tempPath = `${USERS_DB_PATH}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.users, null, 2), 'utf8');
      fs.renameSync(tempPath, USERS_DB_PATH);
    } catch (err) {
      console.error('[DB] Atomic write error on users:', err);
    }
  }

  async getHotspots(filters = {}) {
    let list = [...this.hotspots];

    if (filters.category && filters.category !== 'all') {
      list = list.filter(h => (h.category || '').toLowerCase() === filters.category.toLowerCase());
    }

    if (filters.status && filters.status !== 'all') {
      list = list.filter(h => (h.status || '').toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.recyclablesOnly === 'true' || filters.recyclablesOnly === true) {
      list = list.filter(h => ['plastic', 'scrap'].includes((h.category || '').toLowerCase()) && h.status !== 'cleaned');
    }

    if (filters.lat && filters.lng) {
      const uLat = parseFloat(filters.lat);
      const uLng = parseFloat(filters.lng);
      list = list.map(h => ({
        ...h,
        distanceMeters: Math.round(getDistanceMeters(uLat, uLng, h.latitude, h.longitude))
      }));

      if (filters.radiusKm) {
        const radiusM = parseFloat(filters.radiusKm) * 1000;
        list = list.filter(h => (h.distanceMeters || 0) <= radiusM);
      }

      list.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
    }

    return list;
  }

  async getHotspotById(id) {
    return this.hotspots.find(h => h.id === id) || null;
  }

  async findNearby(lat, lng, radiusMeters = 25) {
    return this.hotspots.find(h => {
      if (h.status === 'cleaned') return false;
      return getDistanceMeters(lat, lng, h.latitude, h.longitude) <= radiusMeters;
    }) || null;
  }

  async createHotspot(data) {
    this.hotspots.unshift(data);
    this.saveHotspots();
    return data;
  }

  async upvoteHotspot(id) {
    const item = this.hotspots.find(h => h.id === id);
    if (!item) return null;

    item.upvotes = (item.upvotes || 0) + 1;
    if (item.upvotes >= 20) item.urgency = 'critical';
    else if (item.upvotes >= 10) item.urgency = 'high';
    else if (item.upvotes >= 5 && item.urgency === 'low') item.urgency = 'medium';

    this.saveHotspots();
    return item;
  }

  async updateHotspotStatus(id, { status, cleanedBy, afterPhoto }) {
    const item = this.hotspots.find(h => h.id === id);
    if (!item) return null;

    item.status = status;
    if (status === 'cleaned') {
      item.cleanedAt = new Date().toISOString();
      item.cleanedBy = cleanedBy || 'Govt Safai Mitra Squad';
      item.afterPhoto = afterPhoto || item.afterPhoto;
      item.urgency = 'low';
    } else if (status === 'in_progress') {
      item.cleanedBy = cleanedBy || 'Govt Safai Mitra Squad';
    }

    this.saveHotspots();
    return item;
  }

  async claimHotspot(id, claimedBy) {
    const item = this.hotspots.find(h => h.id === id);
    if (!item) return null;

    item.claimedBy = claimedBy || 'Local Scrap Collector';
    this.saveHotspots();
    return item;
  }

  async getStats() {
    const total = this.hotspots.length;
    const cleaned = this.hotspots.filter(h => h.status === 'cleaned').length;
    const inProgress = this.hotspots.filter(h => h.status === 'in_progress').length;
    const reported = this.hotspots.filter(h => h.status === 'reported').length;
    const recyclables = this.hotspots.filter(h => ['plastic', 'scrap'].includes((h.category || '').toLowerCase())).length;

    return {
      totalSpots: total,
      cleanedSpots: cleaned,
      inProgressSpots: inProgress,
      pendingSpots: reported,
      recyclablesDiverted: recyclables,
      cleanRatePercentage: total > 0 ? Math.round((cleaned / total) * 100) : 0
    };
  }

  async upsertUserProfile(userData) {
    const existing = this.users[userData.id] || {};
    const updated = {
      ...existing,
      ...userData,
      updatedAt: new Date().toISOString()
    };
    this.users[userData.id] = updated;
    this.saveUsers();
    return updated;
  }

  async getUserProfile(id) {
    return this.users[id] || null;
  }
}

// PostgreSQL Adapter (Production with persistent DATABASE_URL)
class PostgresStorageAdapter {
  constructor(connectionString) {
    this.name = 'postgresql';
    this.connectionString = connectionString;
    this.pool = null;
  }

  async init() {
    const { Pool } = require('pg');
    this.pool = new Pool({
      connectionString: this.connectionString,
      ssl: process.env.NODE_ENV === 'production' || this.connectionString.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
    });

    // Run schema creation
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await this.pool.query(schemaSql);
    console.log('[DB] PostgreSQL schema migration verified.');

    // Seed if empty
    const { rows } = await this.pool.query('SELECT COUNT(*) as count FROM hotspots');
    if (parseInt(rows[0].count, 10) === 0 && fs.existsSync(DB_PATH)) {
      try {
        const raw = fs.readFileSync(DB_PATH, 'utf8');
        const seedHotspots = JSON.parse(raw);
        for (const h of seedHotspots) {
          await this.createHotspot(h);
        }
        console.log(`[DB] Seeded ${seedHotspots.length} initial hotspots into PostgreSQL.`);
      } catch (err) {
        console.warn('[DB] Seeding failed:', err?.message);
      }
    }

    return true;
  }

  mapRowToHotspot(r) {
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      status: r.status,
      urgency: r.urgency,
      upvotes: r.upvotes,
      latitude: parseFloat(r.latitude),
      longitude: parseFloat(r.longitude),
      address: r.address,
      beforePhoto: r.before_photo,
      afterPhoto: r.after_photo,
      photos: typeof r.photos === 'string' ? JSON.parse(r.photos) : (r.photos || []),
      reportedBy: r.reported_by,
      reportedAt: r.reported_at,
      cleanedAt: r.cleaned_at,
      cleanedBy: r.cleaned_by,
      claimedBy: r.claimed_by,
    };
  }

  async getHotspots(filters = {}) {
    let query = 'SELECT * FROM hotspots WHERE 1=1';
    const params = [];

    if (filters.category && filters.category !== 'all') {
      params.push(filters.category.toLowerCase());
      query += ` AND LOWER(category) = $${params.length}`;
    }

    if (filters.status && filters.status !== 'all') {
      params.push(filters.status.toLowerCase());
      query += ` AND LOWER(status) = $${params.length}`;
    }

    if (filters.recyclablesOnly === 'true' || filters.recyclablesOnly === true) {
      query += ` AND LOWER(category) IN ('plastic', 'scrap') AND status != 'cleaned'`;
    }

    query += ' ORDER BY created_at DESC';

    const { rows } = await this.pool.query(query, params);
    let list = rows.map(this.mapRowToHotspot);

    if (filters.lat && filters.lng) {
      const uLat = parseFloat(filters.lat);
      const uLng = parseFloat(filters.lng);
      list = list.map(h => ({
        ...h,
        distanceMeters: Math.round(getDistanceMeters(uLat, uLng, h.latitude, h.longitude))
      }));

      if (filters.radiusKm) {
        const radiusM = parseFloat(filters.radiusKm) * 1000;
        list = list.filter(h => (h.distanceMeters || 0) <= radiusM);
      }

      list.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
    }

    return list;
  }

  async getHotspotById(id) {
    const { rows } = await this.pool.query('SELECT * FROM hotspots WHERE id = $1', [id]);
    return rows.length > 0 ? this.mapRowToHotspot(rows[0]) : null;
  }

  async findNearby(lat, lng, radiusMeters = 25) {
    // Check rough bounding box first then Haversine
    const degDelta = radiusMeters / 111000 * 2;
    const { rows } = await this.pool.query(
      `SELECT * FROM hotspots WHERE status != 'cleaned' 
       AND latitude BETWEEN $1 AND $2 
       AND longitude BETWEEN $3 AND $4`,
      [lat - degDelta, lat + degDelta, lng - degDelta, lng + degDelta]
    );

    const list = rows.map(this.mapRowToHotspot);
    return list.find(h => getDistanceMeters(lat, lng, h.latitude, h.longitude) <= radiusMeters) || null;
  }

  async createHotspot(data) {
    const query = `
      INSERT INTO hotspots (
        id, title, description, category, status, urgency, upvotes,
        latitude, longitude, address, before_photo, after_photo, photos,
        reported_by, reported_at, cleaned_at, cleaned_by, claimed_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING *;
    `;
    const params = [
      data.id || `nb-${Date.now().toString(36)}`,
      data.title || 'Waste Dump Reported',
      data.description || '',
      (data.category || 'plastic').toLowerCase(),
      data.status || 'reported',
      data.urgency || 'medium',
      data.upvotes || 1,
      data.latitude,
      data.longitude,
      data.address || 'GPS Location Verified',
      data.beforePhoto || null,
      data.afterPhoto || null,
      JSON.stringify(data.photos || []),
      data.reportedBy || 'Concerned Citizen',
      data.reportedAt || new Date().toISOString(),
      data.cleanedAt || null,
      data.cleanedBy || null,
      data.claimedBy || null
    ];

    const { rows } = await this.pool.query(query, params);
    return this.mapRowToHotspot(rows[0]);
  }

  async upvoteHotspot(id) {
    const query = `
      UPDATE hotspots 
      SET upvotes = upvotes + 1,
          urgency = CASE 
            WHEN upvotes + 1 >= 20 THEN 'critical'
            WHEN upvotes + 1 >= 10 THEN 'high'
            ELSE urgency
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await this.pool.query(query, [id]);
    return rows.length > 0 ? this.mapRowToHotspot(rows[0]) : null;
  }

  async updateHotspotStatus(id, { status, cleanedBy, afterPhoto }) {
    let query;
    let params;

    if (status === 'cleaned') {
      query = `
        UPDATE hotspots 
        SET status = 'cleaned',
            cleaned_at = CURRENT_TIMESTAMP,
            cleaned_by = $2,
            after_photo = COALESCE($3, after_photo),
            urgency = 'low',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *;
      `;
      params = [id, cleanedBy || 'Govt Safai Mitra Squad', afterPhoto || null];
    } else {
      query = `
        UPDATE hotspots 
        SET status = $2,
            cleaned_by = COALESCE($3, cleaned_by),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *;
      `;
      params = [id, status, cleanedBy || 'Govt Safai Mitra Squad'];
    }

    const { rows } = await this.pool.query(query, params);
    return rows.length > 0 ? this.mapRowToHotspot(rows[0]) : null;
  }

  async claimHotspot(id, claimedBy) {
    const query = `
      UPDATE hotspots 
      SET claimed_by = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await this.pool.query(query, [id, claimedBy || 'Local Scrap Collector']);
    return rows.length > 0 ? this.mapRowToHotspot(rows[0]) : null;
  }

  async getStats() {
    const { rows } = await this.pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'cleaned') as cleaned,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'reported') as reported,
        COUNT(*) FILTER (WHERE LOWER(category) IN ('plastic', 'scrap')) as recyclables
      FROM hotspots;
    `);

    const r = rows[0];
    const total = parseInt(r.total, 10) || 0;
    const cleaned = parseInt(r.cleaned, 10) || 0;

    return {
      totalSpots: total,
      cleanedSpots: cleaned,
      inProgressSpots: parseInt(r.in_progress, 10) || 0,
      pendingSpots: parseInt(r.reported, 10) || 0,
      recyclablesDiverted: parseInt(r.recyclables, 10) || 0,
      cleanRatePercentage: total > 0 ? Math.round((cleaned / total) * 100) : 0
    };
  }

  async upsertUserProfile(userData) {
    const query = `
      INSERT INTO users (id, name, email, phone, ward, auth_provider, points, avatar, raw_data, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE 
      SET name = EXCLUDED.name,
          email = COALESCE(EXCLUDED.email, users.email),
          phone = COALESCE(EXCLUDED.phone, users.phone),
          ward = COALESCE(EXCLUDED.ward, users.ward),
          auth_provider = COALESCE(EXCLUDED.auth_provider, users.auth_provider),
          points = COALESCE(EXCLUDED.points, users.points),
          avatar = COALESCE(EXCLUDED.avatar, users.avatar),
          raw_data = EXCLUDED.raw_data,
          updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const params = [
      userData.id,
      userData.name || 'Citizen User',
      userData.email || null,
      userData.phone || null,
      userData.ward || null,
      userData.authProvider || 'mobile_otp',
      userData.points || 50,
      userData.avatar || null,
      JSON.stringify(userData)
    ];

    const { rows } = await this.pool.query(query, params);
    return rows[0];
  }

  async getUserProfile(id) {
    const { rows } = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (rows.length === 0) return null;
    const u = rows[0];
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      ward: u.ward,
      points: u.points,
      avatar: u.avatar,
      authProvider: u.auth_provider,
      ...(u.raw_data || {})
    };
  }
}

// -------------------------------------------------------------
// Initialize Database Service
// -------------------------------------------------------------
async function initDatabase() {
  if (DATABASE_URL) {
    try {
      console.log('[DB] Attempting PostgreSQL connection via DATABASE_URL...');
      const pgAdapter = new PostgresStorageAdapter(DATABASE_URL);
      await pgAdapter.init();
      dbAdapter = pgAdapter;
      console.log('[DB] PostgreSQL active and connected.');
      return dbAdapter;
    } catch (err) {
      console.warn('[DB] PostgreSQL initialization failed, falling back to FileStorageAdapter:', err?.message);
    }
  }

  const fileAdapter = new FileStorageAdapter();
  await fileAdapter.init();
  dbAdapter = fileAdapter;
  return dbAdapter;
}

module.exports = {
  initDatabase,
  getAdapter: () => dbAdapter,
  getDistanceMeters
};
