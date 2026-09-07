import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { Colors, DarkColors, LightColors, CategoryMeta } from '../theme/colors';
import HotspotDetailCard from '../components/HotspotDetailCard';
import AppLogo from '../components/AppLogo';
import { shareReport } from '../services/reportShare';

// Haversine distance calculator in meters
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function formatDistance(meters) {
  if (meters == null) return 'Nearby';
  if (meters < 1000) return `${meters}m away`;
  return `${(meters / 1000).toFixed(1)} km away`;
}

// 4-tier radius options + All
const RADIUS_OPTIONS = [
  { id: 'all', label: 'All Distance', radius: Infinity, icon: '🇮🇳' },
  { id: '500m', label: '500m Circle', radius: 500, icon: '🚶' },
  { id: '1km', label: '1 km Circle', radius: 1000, icon: '🏘️' },
  { id: '5km', label: '5 km Circle', radius: 5000, icon: '🏙️' },
  { id: '10km', label: '10 km Circle', radius: 10000, icon: '🌐' },
];

export default function FeedScreen({
  hotspots,
  onUpvote,
  onUpdateStatus,
  onClaimRecyclables,
  currentRole,
  isDark = true,
  userLocation,
  onOpenReport,
  votedHotspotIds = [],
}) {
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [selectedRadius, setSelectedRadius] = useState('all'); // 'all' | '500m' | '1km' | '5km' | '10km'
  const theme = isDark ? DarkColors : LightColors;

  const uLat = userLocation?.latitude || 28.5672;
  const uLng = userLocation?.longitude || 77.2435;

  // Enrich hotspots with real GPS distance from user
  const enrichedHotspots = (hotspots || []).map((h) => {
    const d = getDistanceMeters(uLat, uLng, parseFloat(h.latitude), parseFloat(h.longitude));
    return { ...h, distanceMeters: d };
  });

  const selectedOption = RADIUS_OPTIONS.find((r) => r.id === selectedRadius) || RADIUS_OPTIONS[0];

  // Filter and sort by proximity
  const filteredHotspots = enrichedHotspots
    .filter((h) => {
      if (selectedOption.radius === Infinity) return true;
      return (h.distanceMeters ?? Infinity) <= selectedOption.radius;
    })
    .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));

  const renderItem = ({ item }) => {
    const cat = CategoryMeta[item.category] || CategoryMeta.plastic;
    const isCleaned = item.status === 'cleaned';

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: theme.surfaceCard, borderColor: theme.border },
        ]}
        activeOpacity={0.75}
        onPress={() => setSelectedHotspot(item)}
      >
        <Image source={{ uri: item.beforePhoto }} style={styles.thumbnail} />

        <View style={styles.cardDetails}>
          <View style={styles.tagRow}>
            <View style={[styles.badge, { backgroundColor: cat.badgeBg, borderColor: cat.color }]}>
              <Text style={[styles.badgeText, { color: cat.color }]}>{cat.label}</Text>
            </View>

            {isCleaned ? (
              <View style={[styles.badge, { backgroundColor: theme.lowContainer, borderColor: theme.low }]}>
                <Text style={[styles.badgeText, { color: theme.low }]}>✨ CLEANED</Text>
              </View>
            ) : (
              <View
                style={[
                  styles.badge,
                  item.urgency === 'critical'
                    ? { backgroundColor: theme.criticalContainer, borderColor: theme.critical }
                    : { backgroundColor: theme.highContainer, borderColor: theme.high },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: item.urgency === 'critical' ? theme.critical : theme.high },
                  ]}
                >
                  {item.urgency.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.cardTitle, { color: theme.textPrimary }]} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.addressRow}>
            <Text style={[styles.cardAddress, { color: theme.textMuted, flex: 1 }]} numberOfLines={1}>
              📍 {item.address}
            </Text>
            {item.distanceMeters != null && (
              <View style={[styles.distBadge, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                <Text style={[styles.distBadgeText, { color: theme.primary }]}>
                  {formatDistance(item.distanceMeters)}
                </Text>
              </View>
            )}
          </View>

          {/* Card Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.upvoteCounter}>
              <Text style={styles.upvoteEmoji}>🔥</Text>
              <Text style={[styles.upvoteText, { color: theme.textSecondary }]}>{item.upvotes} reports</Text>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.shareBtn, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}
                onPress={async () => {
                  try {
                    const result = await shareReport(item);
                    if (result.copied) Alert.alert('Link copied', 'Your report link is ready to share.');
                  } catch (error) {
                    if (error?.name !== 'AbortError') Alert.alert('Share unavailable', 'Please try again from your phone browser.');
                  }
                }}
              >
                <Text style={[styles.inlineUpvoteText, { color: theme.primary }]}>↗ Share</Text>
              </TouchableOpacity>
              {!isCleaned && (
                (votedHotspotIds || []).includes(item.id) ? (
                  <View style={[styles.votedBadge, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}>
                    <Text style={[styles.votedBadgeText, { color: theme.primary }]}>✓ Voted</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.inlineUpvoteBtn, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}
                    onPress={() => onUpvote(item.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.inlineUpvoteText, { color: theme.primary }]}>👍 Vote</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Nearby Waste Feed</Text>
        <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
          Community-verified dumpsites in your area
        </Text>
      </View>

      {/* 4-Tier Radius Filter Bar */}
      <View style={[styles.filterBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.filterHeaderRow}>
          <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>
            Radius Circle:
          </Text>
          <Text style={[styles.filterCountBadge, { color: theme.primary }]}>
            {filteredHotspots.length} spots in {selectedOption.label}
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {RADIUS_OPTIONS.map((opt) => {
            const isSelected = selectedRadius === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setSelectedRadius(opt.id)}
                style={[
                  styles.radiusChip,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surfaceVariant,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text style={styles.radiusChipIcon}>{opt.icon}</Text>
                <Text
                  style={[
                    styles.radiusChipText,
                    {
                      color: isSelected ? theme.textInverse : theme.textPrimary,
                      fontWeight: isSelected ? '800' : '600',
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {filteredHotspots && filteredHotspots.length > 0 ? (
        <FlatList
          data={filteredHotspots}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.primaryContainer }]}>
              <AppLogo size={42} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {hotspots && hotspots.length > 0 ? 'No Spots in this Radius' : '100% Clean Neighborhood!'}
            </Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              {hotspots && hotspots.length > 0
                ? `No active waste reports found within ${selectedOption.label}. Try selecting 5km, 10km, or All Distance to view community reports.`
                : 'No active garbage dumps reported in your area yet. As soon as you or a neighbor spots and geotags an uncleaned spot, it will appear here in real-time.'}
            </Text>
            {hotspots && hotspots.length > 0 && (
              <TouchableOpacity
                style={[styles.resetRadiusBtn, { backgroundColor: theme.primary }]}
                onPress={() => setSelectedRadius('all')}
              >
                <Text style={[styles.resetRadiusText, { color: theme.textInverse }]}>
                  🌐 View All Distance Reports ({hotspots.length})
                </Text>
              </TouchableOpacity>
            )}

            {/* Quick Guidance Card */}
            <View style={[styles.guidanceBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
              <Text style={[styles.guidanceHeading, { color: theme.textPrimary }]}>HOW TO SUBMIT FIRST REPORT</Text>
              <View style={styles.guidanceRow}>
                <Text style={styles.guidanceEmoji}>1️⃣</Text>
                <Text style={[styles.guidanceText, { color: theme.textSecondary }]}>
                  Snap an unedited photo of plastic, scrap, or wet garbage.
                </Text>
              </View>
              <View style={styles.guidanceRow}>
                <Text style={styles.guidanceEmoji}>2️⃣</Text>
                <Text style={[styles.guidanceText, { color: theme.textSecondary }]}>
                  Mappls GPS instantly verifies the exact street coordinates.
                </Text>
              </View>
              <View style={styles.guidanceRow}>
                <Text style={styles.guidanceEmoji}>3️⃣</Text>
                <Text style={[styles.guidanceText, { color: theme.textSecondary }]}>
                  Neighbors upvote to boost urgency, and municipal Safai Mitras clean with photo proof!
                </Text>
              </View>
            </View>

            {onOpenReport && (
              <TouchableOpacity
                style={[styles.reportPromptBtn, { backgroundColor: theme.primary }]}
                onPress={onOpenReport}
                activeOpacity={0.85}
              >
                <Text style={[styles.reportPromptText, { color: theme.textInverse }]}>
                  📸 Snap & Report Waste Spot
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}


      <HotspotDetailCard
        hotspot={selectedHotspot}
        visible={!!selectedHotspot}
        onClose={() => setSelectedHotspot(null)}
        currentRole={currentRole}
        onUpvote={onUpvote}
        hasVoted={(votedHotspotIds || []).includes(selectedHotspot?.id)}
        onUpdateStatus={onUpdateStatus}
        onClaimRecyclables={onClaimRecyclables}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  list: {
    padding: 16,
    gap: 14,
  },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    flexDirection: 'row',
  },
  thumbnail: {
    width: 110,
    height: '100%',
    minHeight: 125,
  },
  cardDetails: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 4,
  },
  cardAddress: {
    fontSize: 11,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  upvoteCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upvoteEmoji: {
    fontSize: 13,
  },
  upvoteText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inlineUpvoteBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  shareBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  inlineUpvoteText: {
    fontSize: 11,
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 34,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  guidanceBox: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    gap: 10,
  },
  guidanceHeading: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  guidanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  guidanceEmoji: {
    fontSize: 15,
    marginTop: 1,
  },
  guidanceText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  reportPromptBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportPromptText: {
    fontSize: 14,
    fontWeight: '900',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 6,
  },
  distBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  distBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterCountBadge: {
    fontSize: 11,
    fontWeight: '800',
  },
  filterScroll: {
    gap: 8,
    paddingRight: 16,
  },
  radiusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  radiusChipIcon: {
    fontSize: 13,
  },
  radiusChipText: {
    fontSize: 12,
  },
  resetRadiusBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 16,
  },
  resetRadiusText: {
    fontSize: 12,
    fontWeight: '800',
  },
});

