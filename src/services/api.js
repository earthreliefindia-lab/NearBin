import { INITIAL_HOTSPOTS } from '../data/mockData';

// Fallback in-memory state for pure offline / standalone execution
let localHotspots = [...INITIAL_HOTSPOTS];

const API_BASE = 'http://localhost:3001/api';

export const WasteService = {
  // Fetch hotspots with optional filter
  async getHotspots(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.category && params.category !== 'all') query.append('category', params.category);
      if (params.status && params.status !== 'all') query.append('status', params.status);
      if (params.recyclablesOnly) query.append('recyclablesOnly', 'true');
      if (params.lat && params.lng) {
        query.append('lat', params.lat);
        query.append('lng', params.lng);
      }

      const res = await fetch(`${API_BASE}/hotspots?${query.toString()}`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        localHotspots = data.hotspots;
        return data.hotspots;
      }
    } catch (e) {
      console.log('[WasteService] Using local fallback state:', e.message);
    }

    // Local in-memory fallback
    let filtered = [...localHotspots];
    if (params.category && params.category !== 'all') {
      filtered = filtered.filter(h => h.category === params.category);
    }
    if (params.status && params.status !== 'all') {
      filtered = filtered.filter(h => h.status === params.status);
    }
    if (params.recyclablesOnly) {
      filtered = filtered.filter(h => ['plastic', 'scrap'].includes(h.category) && h.status !== 'cleaned');
    }
    return filtered;
  },

  // Submit report with duplicate / anti-spam logic
  async submitReport(newReport) {
    try {
      const res = await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReport),
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.log('[WasteService] Submitting to local fallback:', e.message);
    }

    // Local fallback creation
    const created = {
      id: `nb-${Date.now().toString(36)}`,
      title: newReport.title || `${newReport.category.toUpperCase()} Dump Spot`,
      description: newReport.description || 'Reported via camera.',
      category: newReport.category || 'plastic',
      status: 'reported',
      urgency: 'medium',
      upvotes: 1,
      latitude: newReport.latitude || 28.5680,
      longitude: newReport.longitude || 77.2420,
      address: newReport.address || 'Street near report point',
      beforePhoto: newReport.beforePhoto,
      afterPhoto: null,
      reportedBy: newReport.reportedBy || 'Concerned Citizen',
      reportedAt: new Date().toISOString(),
      cleanedAt: null,
      cleanedBy: null,
      claimedBy: null
    };

    localHotspots = [created, ...localHotspots];
    return { success: true, hotspot: created, merged: false, message: 'Report saved successfully!' };
  },

  // Upvote / Confirm hotspot
  async upvoteHotspot(id) {
    try {
      const res = await fetch(`${API_BASE}/reports/${id}/upvote`, {
        method: 'POST',
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.log('[WasteService] Local upvote fallback');
    }

    const item = localHotspots.find(h => h.id === id);
    if (item) {
      item.upvotes = (item.upvotes || 0) + 1;
      if (item.upvotes >= 15) item.urgency = 'critical';
      else if (item.upvotes >= 8) item.urgency = 'high';
      return { success: true, hotspot: item };
    }
    return { success: false };
  },

  // Update Status (Govt Worker cleanup proof)
  async updateStatus(id, { status, cleanedBy, afterPhoto }) {
    try {
      const res = await fetch(`${API_BASE}/reports/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, cleanedBy, afterPhoto }),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.log('[WasteService] Local status update fallback');
    }

    const item = localHotspots.find(h => h.id === id);
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
      return { success: true, hotspot: item };
    }
    return { success: false };
  },

  // Claim recyclables (Kabadiwala mode)
  async claimRecyclables(id, claimedBy) {
    try {
      const res = await fetch(`${API_BASE}/reports/${id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimedBy }),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.log('[WasteService] Local claim fallback');
    }

    const item = localHotspots.find(h => h.id === id);
    if (item) {
      item.claimedBy = claimedBy || 'Scrap Collector';
      return { success: true, hotspot: item };
    }
    return { success: false };
  },

  // Stats
  async getStats() {
    try {
      const res = await fetch(`${API_BASE}/stats`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) return await res.json();
    } catch (e) {
      console.log('[WasteService] Local stats fallback');
    }

    const total = localHotspots.length;
    const cleaned = localHotspots.filter(h => h.status === 'cleaned').length;
    const inProgress = localHotspots.filter(h => h.status === 'in_progress').length;
    const reported = localHotspots.filter(h => h.status === 'reported').length;
    const recyclables = localHotspots.filter(h => ['plastic', 'scrap'].includes(h.category)).length;

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
  }
};
