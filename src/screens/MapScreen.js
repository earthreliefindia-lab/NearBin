import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Colors, DarkColors, LightColors } from '../theme/colors';
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
  onRecenter,
  isDark = true,
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [mapKey, setMapKey] = useState(1);

  const theme = isDark ? DarkColors : LightColors;

  // Filter hotspots for map display
  const filteredHotspots = hotspots.filter((h) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'cleaned') return h.status === 'cleaned';
    return h.category === selectedCategory && h.status !== 'cleaned';
  });

  const handleRecenterClick = async () => {
    setIsLocating(true);
    try {
      if (onRecenter) {
        await onRecenter();
      }
      setMapKey((prev) => prev + 1); // Triggers instant refocus and zoom
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Floating Glass Header (Adapts dynamically to Light & Dark Theme) */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? 'rgba(11, 14, 20, 0.94)' : 'rgba(255, 255, 255, 0.96)',
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View style={styles.brandRow}>
            <Text style={[styles.brandLogo, { color: theme.textPrimary }]}>
              🌱 Near<Text style={{ color: theme.primary }}>Bin</Text>
            </Text>
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
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? theme.primaryContainer : theme.surfaceVariant,
                    borderColor: isActive ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setSelectedCategory(chip.id)}
              >
                <Text style={styles.chipEmoji}>{chip.emoji}</Text>
                <Text
                  style={[
                    styles.chipText,
                    { color: isActive ? theme.primary : theme.textSecondary },
                    isActive && { fontWeight: '800' },
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Interactive Mappls Map with Glowing Heatmap */}
      <View style={styles.mapContainer}>
        <MapplsView
          key={`${mapKey}-${isDark ? 'dark' : 'light'}`}
          hotspots={filteredHotspots}
          userLocation={userLocation}
          onSelectHotspot={(spot) => setSelectedHotspot(spot)}
          selectedCategory={selectedCategory}
          isDark={isDark}
        />
      </View>

      {/* Floating GPS Target / Accuracy Recenter Button */}
      <TouchableOpacity
        style={[
          styles.gpsFab,
          {
            backgroundColor: theme.surfaceCard,
            borderColor: theme.border,
            shadowColor: theme.shadow,
          },
        ]}
        onPress={handleRecenterClick}
        activeOpacity={0.8}
        disabled={isLocating}
      >
        {isLocating ? (
          <ActivityIndicator color={theme.primary} size="small" />
        ) : (
          <Text style={styles.gpsFabIcon}>🎯</Text>
        )}
      </TouchableOpacity>

      {/* Floating Action Button (FAB) - Live Camera Report */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => setReportModalVisible(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>📸</Text>
        <Text style={[styles.fabText, { color: theme.textInverse }]}>Report Spot</Text>
      </TouchableOpacity>

      {/* Waste Report Camera Modal */}
      <WasteReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        onSubmit={onSubmitReport}
        userLocation={userLocation}
        isDark={isDark}
      />

      {/* Hotspot Bottom Sheet Modal */}
      <HotspotDetailCard
        hotspot={selectedHotspot}
        visible={!!selectedHotspot}
        onClose={() => setSelectedHotspot(null)}
        currentRole={currentRole}
        onUpvote={async (id) => {
          await onUpvote(id);
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
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  chipEmoji: {
    fontSize: 13,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mapContainer: {
    flex: 1,
  },
  gpsFab: {
    position: 'absolute',
    bottom: 95,
    right: 18,
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 90,
  },
  gpsFabIcon: {
    fontSize: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#ffffff30',
  },
  fabIcon: {
    fontSize: 20,
  },
  fabText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
