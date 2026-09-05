import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';

export default function BeforeAfterView({ beforePhoto, afterPhoto }) {
  const [activeTab, setActiveTab] = useState(afterPhoto ? 'after' : 'before');

  if (!afterPhoto) {
    return (
      <View style={styles.singleContainer}>
        <Image source={{ uri: beforePhoto }} style={styles.image} />
        <View style={styles.badgePending}>
          <Text style={styles.badgeText}>🔴 BEFORE CLEANUP</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Toggle Selector */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, activeTab === 'before' && styles.toggleActiveBefore]}
          onPress={() => setActiveTab('before')}
        >
          <Text style={[styles.toggleText, activeTab === 'before' && styles.toggleTextActive]}>
            🔴 Before (Garbage Dump)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, activeTab === 'after' && styles.toggleActiveAfter]}
          onPress={() => setActiveTab('after')}
        >
          <Text style={[styles.toggleText, activeTab === 'after' && styles.toggleTextActive]}>
            ✨ After (Cleaned Proof)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Image Display */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: activeTab === 'before' ? beforePhoto : afterPhoto }}
          style={styles.image}
        />
        <View style={activeTab === 'before' ? styles.badgeBefore : styles.badgeAfter}>
          <Text style={styles.badgeText}>
            {activeTab === 'before' ? 'REPORTED STATE' : 'GOVT CLEANUP VERIFIED'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  singleContainer: {
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surfaceVariant,
  },
  imageWrapper: {
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surfaceVariant,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleActiveBefore: {
    backgroundColor: 'rgba(255, 61, 0, 0.2)',
  },
  toggleActiveAfter: {
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.textPrimary,
  },
  badgePending: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,61,0,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeBefore: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,61,0,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeAfter: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,230,118,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
