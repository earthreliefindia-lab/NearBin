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
  isDesktop = false,
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
    <View
      style={[
        styles.container,
        isDesktop && styles.desktopContainer,
        { backgroundColor: theme.background },
      ]}
    >
      {/* DESKTOP SPLIT VIEW: Left Operations Sidebar */}
      {isDesktop && (
        <View style={[styles.desktopSidebar, { backgroundColor: theme.surface, borderRightColor: theme.border }]}>
          <View style={styles.sidebarHeader}>
            <View style={styles.sidebarTitleRow}>
              <Text style={[styles.sidebarTitle, { color: theme.textPrimary }]}>Civic Action Hub</Text>
              <View style={[styles.sidebarLivePill, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}>
                <View style={[styles.liveDot, { backgroundColor: theme.primary }]} />
                <Text style={[styles.sidebarLiveText, { color: theme.primary }]}>GPS SYNC</Text>
              </View>
            </View>
            <Text style={[styles.sidebarSub, { color: theme.textSecondary }]}>
              Live street heat map & municipal cleanup verification
            </Text>

            {/* Filter Chips inside sidebar */}
            <View style={styles.desktopFilterWrap}>
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
            </View>
          </View>

          {/* Sidebar Content: Clean Slate or Active Spot List */}
          <ScrollView style={styles.sidebarScroll} contentContainerStyle={styles.sidebarScrollContent}>
            {filteredHotspots.length === 0 ? (
              <View style={[styles.desktopEmptyBox, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>🌱</Text>
                <Text style={[styles.desktopEmptyTitle, { color: theme.textPrimary }]}>100% Clean Slate!</Text>
                <Text style={[styles.desktopEmptyDesc, { color: theme.textSecondary }]}>
                  No active waste dumps reported in this area. You can photograph and geotag any unattended garbage spot right now.
                </Text>
                <View style={[styles.desktopStepsCard, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                  <Text style={[styles.desktopStepLine, { color: theme.textPrimary }]}>1. 📸 Snap photo of dump</Text>
                  <Text style={[styles.desktopStepLine, { color: theme.textPrimary }]}>2. 📍 GPS automatically tags street</Text>
                  <Text style={[styles.desktopStepLine, { color: theme.textPrimary }]}>3. 👥 Upvote & municipal teams clean</Text>
                </View>
              </View>
            ) : (
              filteredHotspots.map((spot) => (
                <TouchableOpacity
                  key={spot.id}
                  style={[styles.sidebarSpotCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}
                  onPress={() => setSelectedHotspot(spot)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.spotCardTitle, { color: theme.textPrimary }]} numberOfLines={1}>{spot.title}</Text>
                  <Text style={[styles.spotCardAddr, { color: theme.textMuted }]} numberOfLines={1}>📍 {spot.address}</Text>
                  <View style={styles.spotCardFooter}>
                    <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '800' }}>🔥 {spot.upvotes || 1} reports</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700' }}>Inspect spot ➔</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Prominent Action Button Pinned to Sidebar */}
          <View style={[styles.sidebarFooter, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
            <TouchableOpacity
              style={[styles.desktopReportBtn, { backgroundColor: theme.primary }]}
              onPress={() => setReportModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={[styles.desktopReportBtnText, { color: theme.textInverse }]}>
                📸 Snap & Report Waste Spot
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* MOBILE ONLY: Top Floating Glass Header */}
      {!isDesktop && (
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
      )}


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

      {/* Clean Slate Guidance Hint (Displays until first report is submitted) */}
      {/* Clean Slate Guidance Hint for Mobile (Desktop renders this in sidebar) */}
      {!isDesktop && filteredHotspots.length === 0 && (
        <View
          style={[
            styles.emptyHintCard,
            {
              backgroundColor: isDark ? 'rgba(24, 32, 45, 0.94)' : 'rgba(255, 255, 255, 0.96)',
              borderColor: isDark ? 'rgba(0, 230, 118, 0.35)' : 'rgba(0, 178, 72, 0.3)',
            },
          ]}
        >
          <View style={styles.emptyHintTop}>
            <View style={[styles.emptyHintIconCircle, { backgroundColor: theme.primaryContainer }]}>
              <Text style={styles.emptyHintIcon}>🌱</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.cleanBadgeRow}>
                <Text style={[styles.emptyHintTitle, { color: theme.textPrimary }]}>
                  Clean Neighborhood!
                </Text>
                <View style={[styles.liveCleanBadge, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}>
                  <Text style={[styles.liveCleanText, { color: theme.primary }]}>100% CLEAN</Text>
                </View>
              </View>
              <Text style={[styles.emptyHintSub, { color: theme.textSecondary }]}>
                No waste dumps reported in this area yet. Tap below to report an unattended dump with live GPS verification.
              </Text>
            </View>
          </View>

          {/* 3 Quick Guidance Steps */}
          <View style={[styles.hintStepsContainer, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
            <View style={styles.hintStep}>
              <Text style={styles.stepBadge}>1</Text>
              <Text style={[styles.stepLabel, { color: theme.textPrimary }]}>📸 Snap Photo</Text>
            </View>
            <Text style={[styles.stepDivider, { color: theme.textMuted }]}>➔</Text>
            <View style={styles.hintStep}>
              <Text style={styles.stepBadge}>2</Text>
              <Text style={[styles.stepLabel, { color: theme.textPrimary }]}>📍 Auto Geotag</Text>
            </View>
            <Text style={[styles.stepDivider, { color: theme.textMuted }]}>➔</Text>
            <View style={styles.hintStep}>
              <Text style={styles.stepBadge}>3</Text>
              <Text style={[styles.stepLabel, { color: theme.textPrimary }]}>✨ Rapid Clean</Text>
            </View>
          </View>
        </View>
      )}

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

      {/* Floating Action Button (FAB) - Live Camera Report (Mobile Only) */}
      {!isDesktop && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.primary }]}
          onPress={() => setReportModalVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>📸</Text>
          <Text style={[styles.fabText, { color: theme.textInverse }]}>Report Spot</Text>
        </TouchableOpacity>
      )}

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
  emptyHintCard: {
    position: 'absolute',
    bottom: 95,
    left: 16,
    right: 16,
    maxWidth: 580,
    alignSelf: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 85,
  },
  emptyHintTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  emptyHintIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHintIcon: {
    fontSize: 24,
  },
  cleanBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  emptyHintTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  liveCleanBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  liveCleanText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  emptyHintSub: {
    fontSize: 12,
    lineHeight: 17,
  },
  hintStepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  hintStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#00E676',
    color: '#0B0E14',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 18,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  stepDivider: {
    fontSize: 12,
    fontWeight: '800',
  },
  desktopContainer: {
    flexDirection: 'row',
    flex: 1,
    height: '100%',
  },
  desktopSidebar: {
    width: 400,
    maxWidth: '35%',
    height: '100%',
    borderRightWidth: 1,
    flexDirection: 'column',
    zIndex: 10,
  },
  sidebarHeader: {
    padding: 16,
    paddingBottom: 10,
  },
  sidebarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  sidebarLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  sidebarLiveText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sidebarSub: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  desktopFilterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sidebarScroll: {
    flex: 1,
  },
  sidebarScrollContent: {
    padding: 16,
    gap: 12,
  },
  desktopEmptyBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    textAlign: 'center',
  },
  desktopEmptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  desktopEmptyDesc: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 14,
  },
  desktopStepsCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  desktopStepLine: {
    fontSize: 11,
    fontWeight: '700',
  },
  sidebarSpotCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  spotCardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  spotCardAddr: {
    fontSize: 11,
  },
  spotCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sidebarFooter: {
    padding: 14,
    borderTopWidth: 1,
  },
  desktopReportBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopReportBtnText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});


