import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import RoleSwitcher from '../components/RoleSwitcher';

export default function ProfileScreen({ currentRole, onSelectRole, stats }) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🇮🇳</Text>
        </View>
        <Text style={styles.userName}>Keshaw Sharma</Text>
        <Text style={styles.userSubtitle}>Delhi NCT • Swachhata Champion</Text>

        {/* Karma Points Card */}
        <View style={styles.karmaCard}>
          <View style={styles.karmaItem}>
            <Text style={styles.karmaValue}>450</Text>
            <Text style={styles.karmaLabel}>Karma Points</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.karmaItem}>
            <Text style={styles.karmaValue}>12</Text>
            <Text style={styles.karmaLabel}>Spots Cleared</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.karmaItem}>
            <Text style={styles.karmaValue}>Top 3%</Text>
            <Text style={styles.karmaLabel}>City Rank</Text>
          </View>
        </View>
      </View>

      {/* Role Switcher Section */}
      <View style={styles.section}>
        <RoleSwitcher currentRole={currentRole} onSelectRole={onSelectRole} />
      </View>

      {/* Badges Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CIVIC BADGES & ACHIEVEMENTS</Text>
        <View style={styles.badgeGrid}>
          <View style={styles.badgeItem}>
            <Text style={styles.badgeIcon}>🏅</Text>
            <Text style={styles.badgeName}>Street Guardian</Text>
            <Text style={styles.badgeDesc}>5+ Valid spots</Text>
          </View>

          <View style={styles.badgeItem}>
            <Text style={styles.badgeIcon}>⚡</Text>
            <Text style={styles.badgeName}>Quick Reporter</Text>
            <Text style={styles.badgeDesc}>Live camera verified</Text>
          </View>

          <View style={styles.badgeItem}>
            <Text style={styles.badgeIcon}>♻️</Text>
            <Text style={styles.badgeName}>Recycle Ally</Text>
            <Text style={styles.badgeDesc}>Kabadiwala linked</Text>
          </View>
        </View>
      </View>

      {/* Ward / City Impact Analytics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CITY SANITATION IMPACT</Text>
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Hotspots Logged</Text>
            <Text style={styles.statVal}>{stats?.totalSpots || 5}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Sites Sanitized & Cleaned</Text>
            <Text style={[styles.statVal, { color: Colors.primary }]}>{stats?.cleanedSpots || 1}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Recyclable Dump Diverted</Text>
            <Text style={[styles.statVal, { color: Colors.catScrap }]}>{stats?.recyclablesDiverted || 2}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>City Cleanup Rate</Text>
            <Text style={[styles.statVal, { color: Colors.secondary }]}>
              {stats?.cleanRatePercentage || 20}%
            </Text>
          </View>
        </View>
      </View>

      {/* Stock Android System Info */}
      <View style={[styles.section, { marginBottom: 40 }]}>
        <Text style={styles.sectionTitle}>APP & SYSTEM INFO</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>• Theme: Stock Android Material 3 (OLED Dark Mode)</Text>
          <Text style={styles.infoText}>• Maps Engine: Mappls (MapmyIndia Street Resolution)</Text>
          <Text style={styles.infoText}>• Heatmap: Snapchat Radial Density Algorithm</Text>
          <Text style={styles.infoText}>• Build: NearBin v1.0.0-lite (All Android Versions)</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarText: {
    fontSize: 32,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  userSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  karmaCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 18,
    width: '90%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  karmaItem: {
    flex: 1,
    alignItems: 'center',
  },
  karmaValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },
  karmaLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.textMuted,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  badgeGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  badgeItem: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  badgeDesc: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  statsCard: {
    backgroundColor: Colors.surfaceCard,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  infoBox: {
    backgroundColor: Colors.surfaceVariant,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
