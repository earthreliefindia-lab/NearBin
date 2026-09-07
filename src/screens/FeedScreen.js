import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Colors, DarkColors, LightColors, CategoryMeta } from '../theme/colors';
import HotspotDetailCard from '../components/HotspotDetailCard';

export default function FeedScreen({
  hotspots,
  onUpvote,
  onUpdateStatus,
  onClaimRecyclables,
  currentRole,
  isDark = true,
  onOpenReport,
}) {
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const theme = isDark ? DarkColors : LightColors;

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
          <Text style={[styles.cardAddress, { color: theme.textMuted }]} numberOfLines={1}>
            📍 {item.address}
          </Text>

          {/* Card Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.upvoteCounter}>
              <Text style={styles.upvoteEmoji}>🔥</Text>
              <Text style={[styles.upvoteText, { color: theme.textSecondary }]}>{item.upvotes} reports</Text>
            </View>

            {!isCleaned && (
              <TouchableOpacity
                style={[
                  styles.inlineUpvoteBtn,
                  { backgroundColor: theme.surfaceVariant, borderColor: theme.border },
                ]}
                onPress={() => onUpvote(item.id)}
              >
                <Text style={[styles.inlineUpvoteText, { color: theme.primary }]}>👍 Confirm (+1)</Text>
              </TouchableOpacity>
            )}
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

      {hotspots && hotspots.length > 0 ? (
        <FlatList
          data={hotspots}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.primaryContainer }]}>
              <Text style={styles.emptyIcon}>🌱</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              100% Clean Neighborhood!
            </Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              No active garbage dumps reported in your area yet. As soon as you or a neighbor spots and geotags an uncleaned spot, it will appear here in real-time.
            </Text>

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
});

