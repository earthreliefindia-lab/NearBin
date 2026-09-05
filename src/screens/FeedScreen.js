import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Colors, CategoryMeta } from '../theme/colors';
import HotspotDetailCard from '../components/HotspotDetailCard';

export default function FeedScreen({
  hotspots,
  onUpvote,
  onUpdateStatus,
  onClaimRecyclables,
  currentRole,
}) {
  const [selectedHotspot, setSelectedHotspot] = useState(null);

  const renderItem = ({ item }) => {
    const cat = CategoryMeta[item.category] || CategoryMeta.plastic;
    const isCleaned = item.status === 'cleaned';

    return (
      <TouchableOpacity
        style={styles.card}
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
              <View style={[styles.badge, { backgroundColor: Colors.lowContainer, borderColor: Colors.low }]}>
                <Text style={[styles.badgeText, { color: Colors.low }]}>✨ CLEANED</Text>
              </View>
            ) : (
              <View
                style={[
                  styles.badge,
                  item.urgency === 'critical'
                    ? { backgroundColor: Colors.criticalContainer, borderColor: Colors.critical }
                    : { backgroundColor: Colors.highContainer, borderColor: Colors.high },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: item.urgency === 'critical' ? Colors.critical : Colors.high },
                  ]}
                >
                  {item.urgency.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.cardAddress} numberOfLines={1}>📍 {item.address}</Text>

          {/* Card Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.upvoteCounter}>
              <Text style={styles.upvoteEmoji}>🔥</Text>
              <Text style={styles.upvoteText}>{item.upvotes} reports</Text>
            </View>

            {!isCleaned && (
              <TouchableOpacity
                style={styles.inlineUpvoteBtn}
                onPress={() => onUpvote(item.id)}
              >
                <Text style={styles.inlineUpvoteText}>👍 Confirm (+1)</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Nearby Waste Feed</Text>
        <Text style={styles.screenSubtitle}>Community-verified dumpsites in your area</Text>
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
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  list: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.textPrimary,
    lineHeight: 18,
    marginBottom: 4,
  },
  cardAddress: {
    fontSize: 11,
    color: Colors.textMuted,
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
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  inlineUpvoteBtn: {
    backgroundColor: Colors.surfaceVariant,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  inlineUpvoteText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
});
