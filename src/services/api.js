import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_HOTSPOTS } from '../data/mockData';

const STORAGE_KEY = '@nearbin_hotspots_v2';
const RAW_API_URL = process.env.EXPO_PUBLIC_API_URL || '';

export function getApiBase() {
  if (RAW_API_URL && !RAW_API_URL.includes('nearbin-api.onrender.com') && RAW_API_URL !== 'input text') {
    return RAW_API_URL.replace(/\/+$/, '');
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    if (window.location.port === '8081' || window.location.port === '19006') {
      return `${window.location.protocol}//${window.location.hostname}:3001/api`;
    }
    return `${window.location.origin}/api`;
  }
  return null;
}

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
    const apiBase = getApiBase();

    // 1. Fetch from live backend server if reachable
    if (apiBase) {
      try {
        const query = new URLSearchParams();
        if (params.category && params.category !== 'all') query.append('category', params.category);
        if (params.status && params.status !== 'all') query.append('status', params.status);
        if (params.recyclablesOnly) query.append('recyclablesOnly', 'true');
        if (params.lat && params.lng) {
          query.append('lat', params.lat);
          query.append('lng', params.lng);
        }

        const res = await fetch(`${apiBase}/hotspots?${query.toString()}`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.hotspots)) {
            let serverList = data.hotspots;
            if (params.lat && params.lng) {
              const uLat = parseFloat(params.lat);
              const uLng = parseFloat(params.lng);
              serverList = serverList.map(h => ({
                ...h,
                distanceMeters: Math.round(getDistanceMeters(uLat, uLng, h.latitude, h.longitude))
              }));
              serverList.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
            }
            await saveStoredHotspots(serverList);
            return serverList;
          }
        }
      } catch (e) {
        console.log('[WasteService] Server fetch notice, fallback to local storage:', e?.message);
      }
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
    const apiBase = getApiBase();
    const lat = parseFloat(newReport.latitude) || 28.5672;
    const lng = parseFloat(newReport.longitude) || 77.2435;

    // 1. Submit directly to server so all devices immediately see it
    if (apiBase) {
      try {
        const res = await fetch(`${apiBase}/reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newReport),
          signal: AbortSignal.timeout(4000),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.hotspot) {
            const list = await getStoredHotspots();
            const existingIdx = list.findIndex(h => h.id === data.hotspot.id);
            let nextList;
            if (existingIdx >= 0) {
              nextList = [...list];
              nextList[existingIdx] = data.hotspot;
            } else {
              nextList = [data.hotspot, ...list];
            }
            await saveStoredHotspots(nextList);
            return {
              success: true,
              merged: data.merged || false,
              message: data.message || 'Report published to live heatmap!',
              hotspot: data.hotspot
            };
          }
        }
      } catch (e) {
        console.warn('[WasteService] Server submit notice, falling back to local:', e?.message);
      }
    }

    // 2. Offline / Local fallback logic
    const list = await getStoredHotspots();

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

      return {
        success: true,
        merged: true,
        message: 'A report already exists at this spot! Added to the live Snapchat Story of this spot (+1 Upvote).',
        hotspot: existing
      };
    }

    const created = {
      id: newReport.id || `nb-${Date.now().toString(36)}`,
      title: newReport.title || `${(newReport.category || 'Waste').toUpperCase()} Dump Spotted`,
      description: newReport.description || 'Reported via camera.',
      category: (newReport.category || 'plastic').toLowerCase(),
      status: 'reported',
      urgency: 'medium',
      upvotes: 1,
      voters: newReport.reportedBy ? [newReport.reportedBy] : [],
      latitude: lat,
      longitude: lng,
      address: newReport.address || 'GPS verified on Mappls',
      beforePhoto: newReport.beforePhoto,
      afterPhoto: null,
      photos: newReport.photos && newReport.photos.length > 0 ? newReport.photos : [
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
      characterCount: newReport.characterCount || 0,
      notesKarma: newReport.notesKarma || 0,
      karmaAwarded: newReport.karmaAwarded || 50,
      cleanedAt: null,
      cleanedBy: null,
      claimedBy: null
    };

    const updated = [created, ...list];
    await saveStoredHotspots(updated);

    return {
      success: true,
      merged: false,
      message: 'Report published to live heatmap!',
      hotspot: created
    };
  },

  // Upvote / Vote hotspot (Strict 1-Vote per user)
  async upvoteHotspot(id, voterId = 'citizen') {
    const apiBase = getApiBase();
    if (apiBase) {
      try {
        const res = await fetch(`${apiBase}/reports/${id}/upvote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voterId }),
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.hotspot) {
            const list = await getStoredHotspots();
            const idx = list.findIndex(h => h.id === id);
            if (idx >= 0) list[idx] = data.hotspot;
            await saveStoredHotspots(list);
            return { success: data.success !== false, alreadyVoted: !!data.alreadyVoted, hotspot: data.hotspot };
          }
        }
      } catch (e) {
        console.log('[WasteService] Server upvote notice, fallback to local:', e?.message);
      }
    }

    const list = await getStoredHotspots();
    const item = list.find(h => h.id === id);
    if (item) {
      if (!item.voters) item.voters = [];
      if (voterId && item.voters.includes(voterId)) {
        return { success: false, alreadyVoted: true, hotspot: item };
      }
      if (voterId) {
        item.voters.push(voterId);
      }
      item.upvotes = (item.upvotes || 0) + 1;
      if (item.upvotes >= 15) item.urgency = 'critical';
      else if (item.upvotes >= 8) item.urgency = 'high';
      await saveStoredHotspots(list);

      return { success: true, hotspot: item };
    }
    return { success: false };
  },

  // Update Status (Govt Worker cleanup proof)
  async updateStatus(id, { status, cleanedBy, afterPhoto }) {
    const apiBase = getApiBase();
    if (apiBase) {
      try {
        const res = await fetch(`${apiBase}/reports/${id}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, cleanedBy, afterPhoto }),
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.hotspot) {
            const list = await getStoredHotspots();
            const idx = list.findIndex(h => h.id === id);
            if (idx >= 0) list[idx] = data.hotspot;
            await saveStoredHotspots(list);
            return { success: true, hotspot: data.hotspot };
          }
        }
      } catch (e) {
        console.log('[WasteService] Server status update notice, fallback to local:', e?.message);
      }
    }

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

      return { success: true, hotspot: item };
    }
    return { success: false };
  },

  // Claim recyclables (Kabadiwala mode)
  async claimRecyclables(id, claimedBy) {
    const apiBase = getApiBase();
    if (apiBase) {
      try {
        const res = await fetch(`${apiBase}/reports/${id}/claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ claimedBy }),
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.hotspot) {
            const list = await getStoredHotspots();
            const idx = list.findIndex(h => h.id === id);
            if (idx >= 0) list[idx] = data.hotspot;
            await saveStoredHotspots(list);
            return { success: true, hotspot: data.hotspot };
          }
        }
      } catch (e) {
        console.log('[WasteService] Server claim notice, fallback to local:', e?.message);
      }
    }

    const list = await getStoredHotspots();
    const item = list.find(h => h.id === id);
    if (item) {
      item.claimedBy = claimedBy || 'Local Scrap Collector';
      await saveStoredHotspots(list);

      return { success: true, hotspot: item };
    }
    return { success: false };
  },

  // Stats
  async getStats() {
    const apiBase = getApiBase();
    if (apiBase) {
      try {
        const res = await fetch(`${apiBase}/stats`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const data = await res.json();
          if (data.stats) return { success: true, stats: data.stats };
        }
      } catch (e) {}
    }

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
    const apiBase = getApiBase();
    try {
      if (apiBase) {
        const res = await fetch(`${apiBase}/user/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
          signal: AbortSignal.timeout(2500),
        });
        if (res.ok) {
          const data = await res.json();
          return data.user || userData;
        }
      }
    } catch (e) {
      // Offline fallback: profile preserved locally
    }
    return userData;
  },

  // Instant fetch of User Profile from Server
  async getProfile(userId) {
    const apiBase = getApiBase();
    try {
      if (apiBase) {
        const res = await fetch(`${apiBase}/user/profile/${userId}`, {
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            return data.user;
          }
        }
      }
    } catch (e) {
      // Offline fallback
    }
    return null;
  },
};
