import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_HOTSPOTS } from '../data/mockData';

const STORAGE_KEY = '@nearbin_hotspots_v1';
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

// Helper: Haversine distance in meters
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

// In-memory cache
let cachedHotspots = null;

async function getStoredHotspots() {
  if (cachedHotspots) return cachedHotspots;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      cachedHotspots = JSON.parse(raw);
      return cachedHotspots;
    }
  } catch (e) {
    console.log('[Storage] Read error:', e);
  }
  cachedHotspots = [...INITIAL_HOTSPOTS];
  await saveStoredHotspots(cachedHotspots);
  return cachedHotspots;
}

async function saveStoredHotspots(data) {
  cachedHotspots = data;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.log('[Storage] Write error:', e);
  }
}

export const WasteService = {
  // Fetch hotspots with filter & distance
  async getHotspots(params = {}) {
    // 1. Try fetching from remote/local server if reachable
    try {
      const query = new URLSearchParams();
      if (params.category && params.category !== 'all') query.append('category', params.category);
      if (params.status && params.status !== 'all') query.append('status', params.status);
      if (params.recyclablesOnly) query.append('recyclablesOnly', 'true');
      if (params.lat && params.lng) {
        query.append('lat', params.lat);
        query.append('lng', params.lng);
      }

      const res = await fetch(`${API_BASE}/hotspots?${query.toString()}`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        if (data.hotspots && data.hotspots.length > 0) {
          await saveStoredHotspots(data.hotspots);
          return data.hotspots;
        }
      }
    } catch (e) {
      // Server unreachable, fallback to local storage
    }

    // 2. Local persistent storage fallback
    let list = await getStoredHotspots();

    if (params.category && params.category !== 'all') {
      list = list.filter(h => h.category === params.category);
    }
    if (params.status && params.status !== 'all') {
      list = list.filter(h => h.status === params.status);
    }
    if (params.recyclablesOnly) {
      list = list.filter(h => ['plastic', 'scrap'].includes(h.category) && h.status !== 'cleaned');
    }

    if (params.lat && params.lng) {
      const uLat = parseFloat(params.lat);
      const uLng = parseFloat(params.lng);
      list = list.map(h => ({
        ...h,
        distanceMeters: Math.round(getDistanceMeters(uLat, uLng, h.latitude, h.longitude))
      }));
      list.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
    }

    return list;
  },

  // Submit report with duplicate / anti-spam logic
  async submitReport(newReport) {
    const list = await getStoredHotspots();
    const lat = parseFloat(newReport.latitude) || 28.5672;
    const lng = parseFloat(newReport.longitude) || 77.2435;

    // Check duplicate within 25 meters
    const existing = list.find(h => {
      if (h.status === 'cleaned') return false;
      return getDistanceMeters(lat, lng, h.latitude, h.longitude) <= 25;
    });

    if (existing) {
      existing.upvotes = (existing.upvotes || 1) + 1;
      if (existing.upvotes >= 15) existing.urgency = 'critical';
      else if (existing.upvotes >= 8) existing.urgency = 'high';

      if (!existing.photos) existing.photos = [];
      if (newReport.beforePhoto) {
        existing.photos.push({
          id: `p-${Date.now()}`,
          uri: newReport.beforePhoto,
          reportedBy: newReport.reportedBy || 'Concerned Citizen',
          reportedAt: new Date().toISOString(),
          caption: newReport.description || newReport.title || 'Additional dump spotted here',
        });
      }

      await saveStoredHotspots(list);

      // Async background server sync
      fetch(`${API_BASE}/reports/${existing.id}/upvote`, { method: 'POST' }).catch(() => {});

      return {
        success: true,
        merged: true,
        message: 'A report already exists at this spot! Added to the live Snapchat Story of this spot (+1 Upvote).',
        hotspot: existing
      };
    }

    const created = {
      id: `nb-${Date.now().toString(36)}`,
      title: newReport.title || `${(newReport.category || 'Waste').toUpperCase()} Dump Spotted`,
      description: newReport.description || 'Reported via camera.',
      category: (newReport.category || 'plastic').toLowerCase(),
      status: 'reported',
      urgency: 'medium',
      upvotes: 1,
      latitude: lat,
      longitude: lng,
      address: newReport.address || 'GPS verified on Mappls',
      beforePhoto: newReport.beforePhoto,
      afterPhoto: null,
      photos: [
        {
          id: `p-${Date.now()}`,
          uri: newReport.beforePhoto,
          reportedBy: newReport.reportedBy || 'Concerned Citizen',
          reportedAt: new Date().toISOString(),
          caption: newReport.title || 'Initial garbage spot',
        },
      ],
      reportedBy: newReport.reportedBy || 'Concerned Citizen',
      reportedAt: new Date().toISOString(),
      cleanedAt: null,
      cleanedBy: null,
      claimedBy: null
    };

    const updated = [created, ...list];
    await saveStoredHotspots(updated);

    // Background server sync
    fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(created)
    }).catch(() => {});

    return {
      success: true,
      merged: false,
      message: 'Report published to live heatmap!',
      hotspot: created
    };
  },

  // Upvote / Confirm hotspot
  async upvoteHotspot(id) {
    const list = await getStoredHotspots();
    const item = list.find(h => h.id === id);
    if (item) {
      item.upvotes = (item.upvotes || 0) + 1;
      if (item.upvotes >= 15) item.urgency = 'critical';
      else if (item.upvotes >= 8) item.urgency = 'high';
      await saveStoredHotspots(list);

      fetch(`${API_BASE}/reports/${id}/upvote`, { method: 'POST' }).catch(() => {});
      return { success: true, hotspot: item };
    }
    return { success: false };
  },

  // Update Status (Govt Worker cleanup proof)
  async updateStatus(id, { status, cleanedBy, afterPhoto }) {
    const list = await getStoredHotspots();
    const item = list.find(h => h.id === id);
    if (item) {
      item.status = status;
      if (status === 'cleaned') {
        item.cleanedAt = new Date().toISOString();
        item.cleanedBy = cleanedBy || 'Govt Safai Mitra Squad';
        item.afterPhoto = afterPhoto;
        item.urgency = 'low';
      } else if (status === 'in_progress') {
        item.cleanedBy = cleanedBy || 'Govt Safai Mitra Squad';
      }
      await saveStoredHotspots(list);

      fetch(`${API_BASE}/reports/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, cleanedBy, afterPhoto })
      }).catch(() => {});

      return { success: true, hotspot: item };
    }
    return { success: false };
  },

  // Claim recyclables (Kabadiwala mode)
  async claimRecyclables(id, claimedBy) {
    const list = await getStoredHotspots();
    const item = list.find(h => h.id === id);
    if (item) {
      item.claimedBy = claimedBy || 'Local Scrap Collector';
      await saveStoredHotspots(list);

      fetch(`${API_BASE}/reports/${id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimedBy })
      }).catch(() => {});

      return { success: true, hotspot: item };
    }
    return { success: false };
  },

  // Stats
  async getStats() {
    const list = await getStoredHotspots();
    const total = list.length;
    const cleaned = list.filter(h => h.status === 'cleaned').length;
    const inProgress = list.filter(h => h.status === 'in_progress').length;
    const reported = list.filter(h => h.status === 'reported').length;
    const recyclables = list.filter(h => ['plastic', 'scrap'].includes(h.category)).length;

    return {
      success: true,
      stats: {
        totalSpots: total,
        cleanedSpots: cleaned,
        inProgressSpots: inProgress,
        pendingSpots: reported,
        recyclablesDiverted: recyclables,
        cleanRatePercentage: total > 0 ? Math.round((cleaned / total) * 100) : 0
      }
    };
  },

  // Save or Update User Profile on Server
  async saveProfile(userData) {
    try {
      const res = await fetch(`${API_BASE}/user/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        return data.user || userData;
      }
    } catch (e) {
      console.log('Profile sync server error:', e?.message);
    }
    return userData;
  },

  // Instant fetch of User Profile from Server
  async getProfile(userId) {
    try {
      const res = await fetch(`${API_BASE}/user/profile/${userId}`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          return data.user;
        }
      }
    } catch (e) {
      console.log('Profile fetch server error:', e?.message);
    }
    return null;
  },
};
