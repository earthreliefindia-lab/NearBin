import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Colors, CategoryMeta } from '../theme/colors';

export default function ScrapPickerScreen({ hotspots, onClaimRecyclables }) {
  const [claimingId, setClaimingId] = useState(null);

  // Filter only plastic & scrap waste that is not yet cleaned
  const recyclables = hotspots.filter(
    (h) => ['plastic', 'scrap'].includes(h.category) && h.status !== 'cleaned'
  );

  const handleClaim = async (item) => {
    setClaimingId(item.id);
    try {
      await onClaimRecyclables(item.id, 'Raju Scrap Recycler');
    } finally {
      setClaimingId(null);
    }
  };

  const renderItem = ({ item }) => {
    const cat = CategoryMeta[item.category] || CategoryMeta.scrap;
    const isClaimed = !!item.claimedBy;

    return (
      <View style={styles.card}>
        <Image source={{ uri: item.beforePhoto }} style={styles.thumb} />
        
        <View style={styles.details}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: cat.badgeBg, borderColor: cat.color }]}>
              <Text style={[styles.badgeText, { color: cat.color }]}>{cat.label}</Text>
            </View>

            <View style={styles.valueBadge}>
              <Text style={styles.valueText}>💰 RECYCLABLE VALUE</Text>
            </View>
          </View>

          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.address}>📍 {item.address}</Text>

          {isClaimed ? (
            <View style={styles.claimedBox}>
              <Text style={styles.claimedText}>✅ Claimed By: {item.claimedBy}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.claimBtn, claimingId === item.id && { opacity: 0.6 }]}
              onPress={() => handleClaim(item)}
              disabled={claimingId === item.id}
            >
              {claimingId === item.id ? (
                <ActivityIndicator color={Colors.textInverse} size="small" />
              ) : (
                <Text style={styles.claimBtnText}>📦 Claim For Pickup</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Kabadiwala Scrap Radar</Text>
          <Text style={styles.headerSubtitle}>High-value plastics, cardboard & metal for collection</Text>
        </View>
        <View style={styles.ecoBadge}>
          <Text style={styles.ecoText}>CIRCULAR ECONOMY</Text>
        </View>
      </View>

      <FlatList
        data={recyclables}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyTitle}>All Recyclables Collected</Text>
            <Text style={styles.emptySubtitle}>No pending recyclable dump reported right now.</Text>
          </View>
        }
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ecoBadge: {
    backgroundColor: 'rgba(255, 145, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.catScrap,
  },
  ecoText: {
    color: Colors.catScrap,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  list: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumb: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  details: {
    flex: 1,
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  valueBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  valueText: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: '800',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  address: {
    fontSize: 11,
    color: Colors.textMuted,
    marginVertical: 4,
  },
  claimedBox: {
    backgroundColor: Colors.surfaceVariant,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  claimedText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  claimBtn: {
    backgroundColor: Colors.catScrap,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  claimBtnText: {
    color: Colors.textInverse,
    fontSize: 12,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
});
