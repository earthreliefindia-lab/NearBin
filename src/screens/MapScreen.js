import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '../theme/colors';
import MapplsView from '../components/MapplsView';
import WasteReportModal from '../components/WasteReportModal';
import HotspotDetailCard from '../components/HotspotDetailCard';

const FILTER_CHIPS = [
  { id: 'all', label: 'All Hotspots', emoji: '🔥' },
  { id: 'plastic', label: 'Plastic', emoji: '🥤' },
  { id: 'scrap', label: 'Scrap & Metal', emoji: '📦' },
  { id: 'organic', label: 'Wet Food', emoji: '🍎' },
  { id: 'debris', label: 'Debris', emoji: '🧱' },
  { id: 'cleaned', label: 'Cleaned', emoji: '✨' },
];

export default function MapScreen({
  hotspots,
  currentRole,
  onUpvote,
  onUpdateStatus,
  onClaimRecyclables,
  onSubmitReport,
  userLocation,
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  // Filter hotspots for map display
  const filteredHotspots = hotspots.filter((h) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'cleaned') return h.status === 'cleaned';
    return h.category === selectedCategory && h.status !== 'cleaned';
  });

  return (
    <View style={styles.container}>
      {/* Top Floating Glass Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.brandRow}>
            <Text style={styles.brandLogo}>🌱 Near<Text style={{ color: Colors.primary }}>Bin</Text></Text>
            <View style={styles.liveHeatmapBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>SNAP HEATMAP ACTIVE</Text>
            </View>
          </View>
        </View>

        {/* Filter Chips Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTER_CHIPS.map((chip) => {
            const isActive = selectedCategory === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedCategory(chip.id)}
              >
                <Text style={styles.chipEmoji}>{chip.emoji}</Text>
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{chip.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Interactive Mappls Dark Map with Glowing Heatmap */}
      <View style={styles.mapContainer}>
        <MapplsView
          hotspots={filteredHotspots}
          userLocation={userLocation}
          onSelectHotspot={(spot) => setSelectedHotspot(spot)}
          selectedCategory={selectedCategory}
        />
      </View>

      {/* Floating Action Button (FAB) - Live Camera Report */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setReportModalVisible(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>📸</Text>
        <Text style={styles.fabText}>Report Spot</Text>
      </TouchableOpacity>

      {/* Waste Report Camera Modal */}
      <WasteReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        onSubmit={onSubmitReport}
        userLocation={userLocation}
      />

      {/* Hotspot Bottom Sheet Modal */}
      <HotspotDetailCard
        hotspot={selectedHotspot}
        visible={!!selectedHotspot}
        onClose={() => setSelectedHotspot(null)}
        currentRole={currentRole}
        onUpvote={async (id) => {
          await onUpvote(id);
          // refresh selected hotspot
          const updated = hotspots.find((h) => h.id === id);
          if (updated) setSelectedHotspot({ ...updated, upvotes: (updated.upvotes || 0) + 1 });
        }}
        onUpdateStatus={async (id, data) => {
          await onUpdateStatus(id, data);
          setSelectedHotspot(null);
        }}
        onClaimRecyclables={async (id, claimedBy) => {
          await onClaimRecyclables(id, claimedBy);
          setSelectedHotspot(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(11, 14, 20, 0.92)',
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandLogo: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  liveHeatmapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 61, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 0, 0.3)',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.critical,
  },
  liveText: {
    color: Colors.critical,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  filterScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primary,
  },
  chipEmoji: {
    fontSize: 13,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.primary,
  },
  mapContainer: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#ffffff30',
  },
  fabIcon: {
    fontSize: 20,
  },
  fabText: {
    color: Colors.textInverse,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
