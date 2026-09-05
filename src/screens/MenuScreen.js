import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal } from 'react-native';
import { Colors, DarkColors, LightColors } from '../theme/colors';
import WorkerScreen from './WorkerScreen';
import ScrapPickerScreen from './ScrapPickerScreen';

export default function MenuScreen({
  stats,
  isDark,
  onToggleTheme,
  hotspots,
  onUpdateStatus,
  onClaimRecyclables,
}) {
  const [activeSubScreen, setActiveSubScreen] = useState(null); // 'worker' | 'scrap' | null
  const theme = isDark ? DarkColors : LightColors;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>⚙️ Menu & Settings</Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          Preferences, Portals & Citizen Karma
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* User Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
          <View style={styles.profileTop}>
            <View style={[styles.avatarCircle, { borderColor: theme.primary, backgroundColor: theme.surfaceVariant }]}>
              <Text style={styles.avatarEmoji}>🇮🇳</Text>
            </View>
            <View style={styles.profileMeta}>
              <Text style={[styles.userName, { color: theme.textPrimary }]}>Keshaw Sharma</Text>
              <Text style={[styles.userBadge, { color: theme.primary }]}>⭐ Swachhata Champion</Text>
            </View>
          </View>

          {/* Karma Metric Banner */}
          <View style={[styles.karmaBanner, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
            <View style={styles.karmaBlock}>
              <Text style={[styles.karmaNum, { color: theme.primary }]}>480</Text>
              <Text style={[styles.karmaLabel, { color: theme.textMuted }]}>Karma Points</Text>
            </View>
            <View style={[styles.karmaDivider, { backgroundColor: theme.border }]} />
            <View style={styles.karmaBlock}>
              <Text style={[styles.karmaNum, { color: theme.secondary }]}>14</Text>
              <Text style={[styles.karmaLabel, { color: theme.textMuted }]}>Spots Verified</Text>
            </View>
            <View style={[styles.karmaDivider, { backgroundColor: theme.border }]} />
            <View style={styles.karmaBlock}>
              <Text style={[styles.karmaNum, { color: theme.high }]}>Top 2%</Text>
              <Text style={[styles.karmaLabel, { color: theme.textMuted }]}>City Rank</Text>
            </View>
          </View>
        </View>

        {/* 1. Theme Setting: Dark / Light Mode */}
        <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>APPEARANCE</Text>
        <View style={[styles.settingRowCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
          <View style={styles.settingTextCol}>
            <View style={styles.settingIconRow}>
              <Text style={styles.settingEmoji}>{isDark ? '🌙' : '☀️'}</Text>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>
                {isDark ? 'Dark Theme (OLED Black)' : 'Light Theme'}
              </Text>
            </View>
            <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
              {isDark ? 'Optimized for night & battery saving' : 'Bright clean contrast'}
            </Text>
          </View>

          <Switch
            value={isDark}
            onValueChange={onToggleTheme}
            trackColor={{ false: '#CBD5E1', true: theme.primary }}
            thumbColor={'#FFFFFF'}
          />
        </View>

        {/* 2. Special Operational Portals (Government & Recycler) */}
        <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>OPERATIONAL PANELS</Text>
        
        {/* Government Safai Mitra Portal Button */}
        <TouchableOpacity
          style={[styles.portalCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}
          onPress={() => setActiveSubScreen('worker')}
          activeOpacity={0.8}
        >
          <View style={[styles.portalIconBox, { backgroundColor: 'rgba(0, 230, 118, 0.15)' }]}>
            <Text style={styles.portalEmoji}>🚜</Text>
          </View>
          <View style={styles.portalTextCol}>
            <Text style={[styles.portalTitle, { color: theme.textPrimary }]}>Govt Safai Mitra Portal</Text>
            <Text style={[styles.portalSubtitle, { color: theme.textSecondary }]}>
              Municipal sanitation squad tasks, cleanup & proof
            </Text>
          </View>
          <Text style={[styles.portalArrow, { color: theme.primary }]}>➔</Text>
        </TouchableOpacity>

        {/* Kabadiwala / Scrap Recycler Radar Button */}
        <TouchableOpacity
          style={[styles.portalCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}
          onPress={() => setActiveSubScreen('scrap')}
          activeOpacity={0.8}
        >
          <View style={[styles.portalIconBox, { backgroundColor: 'rgba(255, 145, 0, 0.15)' }]}>
            <Text style={styles.portalEmoji}>♻️</Text>
          </View>
          <View style={styles.portalTextCol}>
            <Text style={[styles.portalTitle, { color: theme.textPrimary }]}>Kabadiwala Scrap Radar</Text>
            <Text style={[styles.portalSubtitle, { color: theme.textSecondary }]}>
              High-value cardboard, metal & plastic collection
            </Text>
          </View>
          <Text style={[styles.portalArrow, { color: theme.catScrap }]}>➔</Text>
        </TouchableOpacity>

        {/* City Stats */}
        <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>CITY IMPACT</Text>
        <View style={[styles.statsCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
          <View style={styles.statLine}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Hotspots Logged</Text>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{stats?.totalSpots || 6}</Text>
          </View>
          <View style={styles.statLine}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Sites Sanitized & Cleared</Text>
            <Text style={[styles.statValue, { color: theme.primary }]}>{stats?.cleanedSpots || 2}</Text>
          </View>
          <View style={styles.statLine}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Recyclables Diverted</Text>
            <Text style={[styles.statValue, { color: theme.catScrap }]}>{stats?.recyclablesDiverted || 4}</Text>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Sub-Screen Modal: Govt Safai Mitra */}
      <Modal visible={activeSubScreen === 'worker'} animationType="slide">
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <View style={[styles.subModalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setActiveSubScreen(null)} style={styles.backBtn}>
              <Text style={[styles.backBtnText, { color: theme.textPrimary }]}>← Back to Menu</Text>
            </TouchableOpacity>
          </View>
          <WorkerScreen hotspots={hotspots} onUpdateStatus={onUpdateStatus} />
        </View>
      </Modal>

      {/* Sub-Screen Modal: Kabadiwala Scrap Radar */}
      <Modal visible={activeSubScreen === 'scrap'} animationType="slide">
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <View style={[styles.subModalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setActiveSubScreen(null)} style={styles.backBtn}>
              <Text style={[styles.backBtnText, { color: theme.textPrimary }]}>← Back to Menu</Text>
            </TouchableOpacity>
          </View>
          <ScrapPickerScreen hotspots={hotspots} onClaimRecyclables={onClaimRecyclables} />
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  scroll: {
    padding: 16,
    gap: 12,
  },
  profileCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 26,
  },
  profileMeta: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
  },
  userBadge: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  karmaBanner: {
    flexDirection: 'row',
    borderRadius: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  karmaBlock: {
    flex: 1,
    alignItems: 'center',
  },
  karmaNum: {
    fontSize: 16,
    fontWeight: '900',
  },
  karmaLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  karmaDivider: {
    width: 1,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  settingRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  settingTextCol: {
    flex: 1,
  },
  settingIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingEmoji: {
    fontSize: 18,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  settingSub: {
    fontSize: 12,
    marginTop: 3,
  },
  portalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  portalIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalEmoji: {
    fontSize: 22,
  },
  portalTextCol: {
    flex: 1,
  },
  portalTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  portalSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  portalArrow: {
    fontSize: 18,
    fontWeight: '900',
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  statLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  subModalHeader: {
    paddingTop: 16,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    paddingVertical: 6,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
