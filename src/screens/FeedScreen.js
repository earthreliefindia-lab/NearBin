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

      <FlatList
        data={hotspots}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

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
});
