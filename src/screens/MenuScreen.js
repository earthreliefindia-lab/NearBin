import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Alert,
  Linking,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors, DarkColors, LightColors } from '../theme/colors';
import WorkerScreen from './WorkerScreen';
import ScrapPickerScreen from './ScrapPickerScreen';
import AppLogo from '../components/AppLogo';
import { getCityCleanlinessData } from '../services/governmentCleanlinessData';
import { KarmaService } from '../services/karmaService';

// Earth Relief India Official Information
const BRAND_INFO = {
  name: 'Earth Relief India',
  tagline: 'Eco-Friendly, 100% Biodegradable & Compostable Alternatives to Plastic',
  address: 'Near Jogendra Market, Plot NO.08, vill-Bishnulli, Dadri, Greater Noida, Uttar Pradesh 203207',
  mapsUrl: 'https://maps.app.goo.gl/WwpK8YgHns8wPaay5',
  phone: '+91 78388 89588',
  phoneTel: 'tel:+917838889588',
  whatsappUrl: 'https://wa.me/917838889588',
  emails: ['eco@earthrelief.in', 'earthrelief.india@gmail.com'],
  founder: {
    name: 'Keshav Singh',
    role: 'Founder & Managing Director',
    email: 'keshavsingh6775@gmail.com',
    linkedin: 'https://www.linkedin.com/in/keshav-singh-45814a373/',
  },
  socials: [
    { id: 'instagram', label: 'Instagram', icon: '📸', url: 'https://www.instagram.com/earthrelief.india?igsh=MWs2d3lqMzBycXlidQ==' },
    { id: 'whatsapp', label: 'WhatsApp', icon: '💬', url: 'https://wa.me/917838889588' },
    { id: 'linkedin', label: 'LinkedIn', icon: '💼', url: 'https://www.linkedin.com/in/earth-relief-8722213b0/' },
    { id: 'twitter', label: 'X (Twitter)', icon: '🐦', url: 'https://x.com/earth_relief' },
    { id: 'facebook', label: 'Facebook', icon: '👥', url: 'https://www.facebook.com/earthrelief.india/' },
    { id: 'youtube', label: 'YouTube', icon: '🎥', url: 'https://www.youtube.com/channel/UCLd98X24FN4_vz23l-FIVYA?sub_confirmation=1' },
    { id: 'github', label: 'GitHub Repo', icon: '🐙', url: 'https://github.com/earthreliefindia-lab/NearBin' },
  ],
};

export default function MenuScreen({
  stats,
  isDark,
  onToggleTheme,
  hotspots,
  onUpdateStatus,
  onClaimRecyclables,
  user,
  onUpdateProfile,
  onLogout,
  onReplayTutorial,
  onOpenInstall,
  onRequireAuth,
  onClaimWelcomeBonus,
  onShareReferral,
  userLocation,
}) {
  const [activeSubScreen, setActiveSubScreen] = useState(null); // 'worker' | 'scrap' | 'about' | null
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isClaimingWelcome, setIsClaimingWelcome] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [referralStats, setReferralStats] = useState({ friendsJoined: 0, karmaEarned: 0 });

  useEffect(() => {
    if (user) {
      KarmaService.fetchReferralStats(user)
        .then((stats) => {
          if (stats) setReferralStats(stats);
        })
        .catch(() => {});
    }
  }, [user]);

  // Edit profile form state
  const [editName, setEditName] = useState(user?.name || 'Keshaw Sharma');
  const [editPhone, setEditPhone] = useState(user?.phone || '+91 98765 43210');
  const [editWard, setEditWard] = useState(user?.ward || 'South Delhi Ward 14 - Malviya Nagar');

  const theme = isDark ? DarkColors : LightColors;

  const handleOpenEdit = () => {
    setEditName(user?.name || 'Keshaw Sharma');
    setEditPhone(user?.phone || '+91 98765 43210');
    setEditWard(user?.ward || 'South Delhi Ward 14 - Malviya Nagar');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }

    const updated = {
      ...(user || {}),
      name: editName.trim(),
      phone: editPhone.trim(),
      ward: editWard.trim(),
    };

    if (onUpdateProfile) {
      onUpdateProfile(updated);
    }
    setIsEditingProfile(false);
    Alert.alert('Profile Updated', 'Your civic profile has been saved and synced to the server.');
  };

  const handleConfirmLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out from NearBin?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            if (onLogout) onLogout();
          },
        },
      ]
    );
  };

  const handleClaimWelcome = async () => {
    if (!user || !onClaimWelcomeBonus || isClaimingWelcome) return;
    setIsClaimingWelcome(true);
    try {
      const result = await onClaimWelcomeBonus();
      Alert.alert('Welcome reward claimed', `500 Karma points are now in your NearBin account. New balance: ${result.karma}.`);
    } catch (error) {
      Alert.alert('Could not claim reward', error?.message || 'Please try again in a moment.');
    } finally {
      setIsClaimingWelcome(false);
    }
  };

  const handleShareReferral = async () => {
    if (!user || !onShareReferral) return;
    try {
      await onShareReferral();
    } catch (error) {
      if (error?.name !== 'AbortError') Alert.alert('Sharing unavailable', 'Please try again from your device.');
    }
  };

  const handleCopyReferral = async () => {
    if (!user) return;
    const url = KarmaService.referralUrl(user);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else if (typeof document !== 'undefined') {
        const el = document.createElement('textarea');
        el.value = url;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopiedReferral(true);
      setTimeout(() => setCopiedReferral(false), 2500);
    } catch (e) {
      Alert.alert('Referral Link', url);
    }
  };

  const openLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch (e) {
      console.log('Error opening link:', e);
    }
  };

  const displayName = user?.name || 'Citizen';
  const displayPhone = user?.phone || '+91 98765 43210';
  const displayWard = user?.ward || 'Municipal Ward - Geotagged Zone';
  const displayKarma = user?.karma ?? 0;
  const displayReports = user?.verifiedReports ?? 0;
  const isGoogleUser = Boolean(user?.authProvider?.toLowerCase().includes('google') || user?.email);
  const isAvatarUrl = Boolean(
    user?.avatar &&
    (typeof user.avatar === 'string') &&
    (user.avatar.startsWith('http://') || user.avatar.startsWith('https://'))
  );

  const cityRanking = getCityCleanlinessData(userLocation, user?.ward);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>⚙️ Menu & Settings</Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          Preferences, Brand Portals & Citizen Karma
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* User Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
          <View style={styles.profileTop}>
            <View style={[styles.avatarCircle, { borderColor: theme.primary, backgroundColor: theme.surfaceVariant }]}>
              {isAvatarUrl ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <AppLogo size={58} />
              )}
            </View>
            <View style={styles.profileMeta}>
              <Text style={[styles.userName, { color: theme.textPrimary }]} numberOfLines={1}>{displayName}</Text>
              <Text style={[styles.userWard, { color: theme.textSecondary }]} numberOfLines={1}>
                📍 {displayWard}
              </Text>
              <Text style={[styles.userBadge, { color: theme.primary }]}>⭐ Swachhata Champion</Text>
            </View>
            {/* Edit Profile Button or Sign In Button */}
            {user ? (
              <TouchableOpacity
                style={[styles.editProfileBtn, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}
                onPress={handleOpenEdit}
                activeOpacity={0.8}
              >
                <Text style={[styles.editProfileBtnText, { color: theme.primary }]}>✏️ Edit</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.editProfileBtn, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}
                onPress={onRequireAuth}
                activeOpacity={0.8}
              >
                <Text style={[styles.editProfileBtnText, { color: theme.primary, fontWeight: '800' }]}>🔑 Sign In</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* User Contact & Auth method badge */}
          <View style={[styles.contactRow, { borderTopColor: theme.border }]}>
            <Text style={[styles.contactLabel, { color: theme.textMuted }]}>
              {user?.email ? 'Account:' : 'Contact / ID:'}
            </Text>
            <Text style={[styles.contactValue, { color: theme.textPrimary }]} numberOfLines={1}>
              {user?.email || (user ? displayPhone : 'Guest (Click Sign In above)')}
            </Text>
            <View
              style={[
                styles.authProviderBadge,
                { backgroundColor: isGoogleUser ? 'rgba(66, 133, 244, 0.12)' : theme.primaryContainer },
              ]}
            >
              <Text style={[styles.authProviderText, { color: isGoogleUser ? '#4285F4' : theme.primary }]}>
                {isGoogleUser ? '🌐 Google Verified' : (user ? '📱 Phone OTP' : '👤 Guest')}
              </Text>
            </View>
          </View>

          {/* Karma Metric Banner */}
          <View style={[styles.karmaBanner, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
            <View style={styles.karmaBlock}>
              <Text style={[styles.karmaNum, { color: theme.primary }]}>{displayKarma}</Text>
              <Text style={[styles.karmaLabel, { color: theme.textMuted }]}>Karma Points</Text>
            </View>
            <View style={[styles.karmaDivider, { backgroundColor: theme.border }]} />
            <View style={styles.karmaBlock}>
              <Text style={[styles.karmaNum, { color: theme.secondary }]}>{displayReports}</Text>
              <Text style={[styles.karmaLabel, { color: theme.textMuted }]}>Spots Verified</Text>
            </View>
            <View style={[styles.karmaDivider, { backgroundColor: theme.border }]} />
            <View style={styles.karmaBlock}>
              <Text style={[styles.karmaNum, { color: theme.high }]}>#{cityRanking.nationalRank}</Text>
              <Text style={[styles.karmaLabel, { color: theme.textMuted }]}>{cityRanking.cityName.split(' ')[0]} Rank</Text>
            </View>
          </View>
        </View>

        {/* Government Swachh Survekshan Official Cleanliness Ranking Card */}
        <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
          GOVERNMENT CLEANLINESS RANKING (MOHUA)
        </Text>
        <View style={[styles.govRankingCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
          <View style={styles.govCardHeader}>
            <View style={[styles.govIconCircle, { backgroundColor: theme.primaryContainer }]}>
              <Text style={styles.govIcon}>🏛️</Text>
            </View>
            <View style={styles.govTitleCol}>
              <View style={styles.govBadgeRow}>
                <View style={[styles.govBadge, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}>
                  <Text style={[styles.govBadgeText, { color: theme.primary }]}>
                    SWACHH SURVEKSHAN
                  </Text>
                </View>
                {cityRanking.distanceKm != null && (
                  <Text style={[styles.govDistanceText, { color: theme.textSecondary }]}>
                    📍 {cityRanking.distanceKm} km away
                  </Text>
                )}
              </View>
              <Text style={[styles.govCityName, { color: theme.textPrimary }]}>
                {cityRanking.cityName}
              </Text>
              <Text style={[styles.govStateName, { color: theme.textSecondary }]}>
                {cityRanking.state} · Ministry of Housing & Urban Affairs
              </Text>
            </View>
          </View>

          {/* Ranks Grid */}
          <View style={[styles.govGrid, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
            <View style={styles.govGridItem}>
              <Text style={[styles.govGridRank, { color: theme.primary }]}>
                #{cityRanking.nationalRank}
              </Text>
              <Text style={[styles.govGridLabel, { color: theme.textMuted }]}>
                All-India Rank
              </Text>
            </View>
            <View style={[styles.govGridDivider, { backgroundColor: theme.border }]} />
            <View style={styles.govGridItem}>
              <Text style={[styles.govGridRank, { color: theme.secondary }]}>
                #{cityRanking.stateRank}
              </Text>
              <Text style={[styles.govGridLabel, { color: theme.textMuted }]}>
                {cityRanking.state.split(' ')[0]} Rank
              </Text>
            </View>
            <View style={[styles.govGridDivider, { backgroundColor: theme.border }]} />
            <View style={styles.govGridItem}>
              <Text style={[styles.govGridRank, { color: theme.high }]}>
                {cityRanking.score}
              </Text>
              <Text style={[styles.govGridLabel, { color: theme.textMuted }]}>
                /{cityRanking.maxScore} Score
              </Text>
            </View>
          </View>

          {/* Detailed metrics pill rows */}
          <View style={styles.govPillsContainer}>
            <View style={[styles.govPill, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
              <Text style={styles.govPillIcon}>⭐</Text>
              <Text style={[styles.govPillText, { color: theme.textPrimary }]}>
                {cityRanking.gfcRating}
              </Text>
            </View>
            <View style={[styles.govPill, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
              <Text style={styles.govPillIcon}>💧</Text>
              <Text style={[styles.govPillText, { color: theme.textPrimary }]}>
                {cityRanking.waterStatus}
              </Text>
            </View>
            <View style={[styles.govPill, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
              <Text style={styles.govPillIcon}>♻️</Text>
              <Text style={[styles.govPillText, { color: theme.textPrimary }]}>
                Waste Processing: {cityRanking.wasteProcessingRate}
              </Text>
            </View>
            <View style={[styles.govPill, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
              <Text style={styles.govPillIcon}>🚪</Text>
              <Text style={[styles.govPillText, { color: theme.textPrimary }]}>
                Door-to-Door: {cityRanking.doorToDoorSegregation}
              </Text>
            </View>
          </View>

          <View style={[styles.govFooterRow, { borderTopColor: theme.border }]}>
            <Text style={[styles.govNoteText, { color: theme.textMuted }]}>
              Live Government of India data matched to your device GPS coordinates and municipal ward.
            </Text>
            <TouchableOpacity
              onPress={() => openLink('https://swachhsurvekshan.gov.in')}
              style={[styles.govPortalBtn, { borderColor: theme.primary, backgroundColor: theme.primaryContainer }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.govPortalBtnText, { color: theme.primary }]}>
                MoHUA Portal ↗
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Secure karma rewards: shown only to an authenticated Google user. */}
        <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>KARMA BOOSTERS</Text>
        {user ? (
          <View style={[styles.boosterCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
            {!user.welcomeClaimedAt && (
              <TouchableOpacity
                style={[styles.welcomeReward, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}
                onPress={handleClaimWelcome}
                disabled={isClaimingWelcome}
                activeOpacity={0.85}
              >
                <View style={styles.boosterTextCol}>
                  <Text style={[styles.boosterTitle, { color: theme.primary }]}>Welcome to NearBin · +500 Karma</Text>
                  <Text style={[styles.boosterSub, { color: theme.textSecondary }]}>Claim your one-time citizen welcome reward.</Text>
                </View>
                {isClaimingWelcome ? <ActivityIndicator color={theme.primary} /> : <Text style={[styles.claimText, { color: theme.primary }]}>Claim</Text>}
              </TouchableOpacity>
            )}

            {/* Dedicated Referral Invite System with unique link and instant reward */}
            <View style={[styles.referralCardBox, { backgroundColor: isDark ? '#0F291E' : '#F0FDF4', borderColor: isDark ? '#166534' : '#BBF7D0' }]}>
              <View style={styles.referralHeaderRow}>
                <View style={[styles.referralIconCircle, { backgroundColor: isDark ? '#14532D' : '#DCFCE7' }]}>
                  <Text style={{ fontSize: 18 }}>🤝</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.referralTitle, { color: theme.textPrimary }]}>Invite Friends & Earn Karma</Text>
                  <Text style={[styles.referralBadgeText, { color: isDark ? '#4ADE80' : '#15803D' }]}>
                    +300 for friend • +100 for you
                  </Text>
                </View>
                <View style={[styles.referralCodeBadge, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}>
                  <Text style={[styles.referralCodeBadgeText, { color: theme.primary }]}>
                    {KarmaService.getReferralCode(user)}
                  </Text>
                </View>
              </View>

              <Text style={[styles.referralDescription, { color: theme.textSecondary }]}>
                Share your personal link. New users joining via your link receive <Text style={{ fontWeight: '800', color: theme.primary }}>300 Karma points</Text>, and you receive <Text style={{ fontWeight: '800', color: theme.primary }}>+100 Karma points</Text> credited to your profile!
              </Text>

              {/* Unique Referral Link Box with Copy Button */}
              <View style={[styles.referralLinkContainer, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                <Text numberOfLines={1} style={[styles.referralLinkText, { color: theme.textPrimary }]}>
                  {KarmaService.referralUrl(user)}
                </Text>
                <TouchableOpacity
                  style={[styles.referralCopyBtn, { backgroundColor: copiedReferral ? '#16A34A' : theme.primary }]}
                  onPress={handleCopyReferral}
                  activeOpacity={0.8}
                >
                  <Text style={styles.referralCopyBtnText}>{copiedReferral ? '✓ Copied!' : '📋 Copy'}</Text>
                </TouchableOpacity>
              </View>

              {/* Stats & Share Action Row */}
              <View style={styles.referralFooterRow}>
                <View style={styles.referralStatsPill}>
                  <Text style={[styles.referralStatsText, { color: theme.textSecondary }]}>
                    Friends: <Text style={{ fontWeight: '800', color: theme.primary }}>{referralStats.friendsJoined}</Text>  |  Earned: <Text style={{ fontWeight: '800', color: theme.primary }}>+{referralStats.karmaEarned} pts</Text>
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.referralShareBtn, { backgroundColor: theme.primary }]}
                  onPress={handleShareReferral}
                  activeOpacity={0.8}
                >
                  <Text style={styles.referralShareBtnText}>Share Link ↗</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.adNotice, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
              <Text style={styles.settingEmoji}>🎬</Text>
              <View style={styles.boosterTextCol}>
                <Text style={[styles.boosterTitle, { color: theme.textPrimary }]}>More boosters · +100 Karma</Text>
                <Text style={[styles.boosterSub, { color: theme.textSecondary }]}>Rewarded ads will be available in the upcoming Android app build. Web ads do not grant points.</Text>
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={[styles.settingRowCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]} onPress={onRequireAuth} activeOpacity={0.8}>
            <View style={styles.settingTextCol}>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>Sign in to earn Karma</Text>
              <Text style={[styles.settingSub, { color: theme.textSecondary }]}>Your rewards and referral link are protected by your Google account.</Text>
            </View>
            <Text style={[styles.portalArrow, { color: theme.primary }]}>➔</Text>
          </TouchableOpacity>
        )}

        {/* 1. Theme Setting: Dark / Light Mode */}
        <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>APPEARANCE</Text>
        <View style={[styles.settingRowCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
          <View style={styles.settingTextCol}>
            <View style={styles.settingIconRow}>
              <Text style={styles.settingEmoji}>{isDark ? '🌙' : '☀️'}</Text>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>
                {isDark ? 'Dark Theme (OLED Black)' : 'Light Theme (Clean White)'}
              </Text>
            </View>
            <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
              {isDark ? 'Optimized for night & battery saving' : 'High contrast bright street mode'}
            </Text>
          </View>

          <Switch
            value={isDark}
            onValueChange={onToggleTheme}
            trackColor={{ false: '#CBD5E1', true: theme.primary }}
            thumbColor={'#FFFFFF'}
          />
        </View>

        {/* Replay Onboarding Tutorial */}
        {onReplayTutorial && (
          <TouchableOpacity
            style={[styles.settingRowCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border, marginTop: -4 }]}
            onPress={onReplayTutorial}
            activeOpacity={0.8}
          >
            <View style={styles.settingTextCol}>
              <View style={styles.settingIconRow}>
                <Text style={styles.settingEmoji}>📖</Text>
                <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>App Guide & Walkthrough</Text>
              </View>
              <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                Replay features, camera GPS guide & role tutorials
              </Text>
            </View>
            <Text style={[styles.portalArrow, { color: theme.primary }]}>➔</Text>
          </TouchableOpacity>
        )}

        {/* Install App on Device (PWA / APK) */}
        {onOpenInstall && (
          <TouchableOpacity
            style={[styles.settingRowCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border, marginTop: -4 }]}
            onPress={onOpenInstall}
            activeOpacity={0.8}
          >
            <View style={styles.settingTextCol}>
              <View style={styles.settingIconRow}>
                <Text style={styles.settingEmoji}>📲</Text>
                <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>Install NearBin App</Text>
              </View>
              <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                Add 0 MB Lite App to Home Screen or Download Standalone APK
              </Text>
            </View>
            <Text style={[styles.portalArrow, { color: theme.primary }]}>➔</Text>
          </TouchableOpacity>
        )}

        {/* 2. Operational Portals (Government & Recycler) */}
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

        {/* 3. About Earth Relief India & Founder Spotlight */}
        <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>ABOUT & MISSION</Text>
        <TouchableOpacity
          style={[styles.brandHighlightCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}
          onPress={() => setActiveSubScreen('about')}
          activeOpacity={0.85}
        >
          <View style={styles.brandCardTop}>
            <View style={[styles.brandLogoBox, { backgroundColor: theme.primaryContainer }]}>
              <Text style={styles.brandLogoIcon}>🌿</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.brandCardTitle, { color: theme.textPrimary }]}>Earth Relief India</Text>
              <Text style={[styles.brandCardSub, { color: theme.primary }]}>
                Founded by Keshav Singh • Biodegradable Alternatives
              </Text>
            </View>
            <Text style={[styles.portalArrow, { color: theme.primary }]}>➔</Text>
          </View>

          <Text style={[styles.brandSnippetText, { color: theme.textSecondary }]} numberOfLines={3}>
            Challenging the plastic epidemic choking Indian lands & air. Reimagining packaging with 100% natural, soil-decomposable alternatives.
          </Text>

          {/* Quick Contact Chips Row */}
          <View style={styles.quickChipsRow}>
            <TouchableOpacity
              style={[styles.quickChip, { backgroundColor: '#25D36620', borderColor: '#25D366' }]}
              onPress={() => openLink(BRAND_INFO.whatsappUrl)}
            >
              <Text style={styles.quickChipEmoji}>💬</Text>
              <Text style={[styles.quickChipText, { color: '#25D366' }]}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickChip, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}
              onPress={() => openLink(BRAND_INFO.mapsUrl)}
            >
              <Text style={styles.quickChipEmoji}>📍</Text>
              <Text style={[styles.quickChipText, { color: theme.textPrimary }]}>HQ Maps</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickChip, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}
              onPress={() => openLink('https://github.com/earthreliefindia-lab/NearBin')}
            >
              <Text style={styles.quickChipEmoji}>🐙</Text>
              <Text style={[styles.quickChipText, { color: theme.textPrimary }]}>GitHub</Text>
            </TouchableOpacity>
          </View>
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

        {/* Legal & Compliance Policies */}
        <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>LEGAL & POLICIES</Text>
        <TouchableOpacity
          style={[styles.settingRowCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}
          onPress={() => setActiveSubScreen('privacy')}
          activeOpacity={0.8}
        >
          <View style={styles.settingTextCol}>
            <View style={styles.settingIconRow}>
              <Text style={styles.settingEmoji}>🔒</Text>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>Privacy Policy</Text>
            </View>
            <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
              Google OAuth data disclosures, GPS privacy, deletion rights & limited use
            </Text>
          </View>
          <Text style={[styles.portalArrow, { color: theme.primary }]}>➔</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingRowCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border, marginTop: -4 }]}
          onPress={() => setActiveSubScreen('terms')}
          activeOpacity={0.8}
        >
          <View style={styles.settingTextCol}>
            <View style={styles.settingIconRow}>
              <Text style={styles.settingEmoji}>📜</Text>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>Terms & Conditions</Text>
            </View>
            <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
              Civic reporting standards, content licensing, safety & liability
            </Text>
          </View>
          <Text style={[styles.portalArrow, { color: theme.primary }]}>➔</Text>
        </TouchableOpacity>

        {/* Account & Session Management */}
        <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>ACCOUNT & SESSION</Text>
        {user ? (
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}
            onPress={handleConfirmLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutIcon}>🚪</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.logoutText, { color: theme.critical }]}>Sign Out / Switch Account</Text>
              <Text style={[styles.logoutSub, { color: theme.textMuted }]}>Clear saved session on this device</Text>
            </View>
            <Text style={[styles.logoutArrow, { color: theme.critical }]}>➔</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}
            onPress={onRequireAuth}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutIcon}>🔑</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.logoutText, { color: theme.primary, fontWeight: '800' }]}>Sign In with Google Account</Text>
              <Text style={[styles.logoutSub, { color: theme.textSecondary }]}>One-tap secure access to sync reports & karma</Text>
            </View>
            <Text style={[styles.logoutArrow, { color: theme.primary }]}>➔</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditingProfile} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.editSheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.sheetHeaderRow}>
              <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>✏️ Edit Profile</Text>
              <TouchableOpacity onPress={() => setIsEditingProfile(false)}>
                <Text style={[styles.sheetCloseText, { color: theme.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Full Name */}
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>FULL NAME</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: theme.surfaceVariant, borderColor: theme.border, color: theme.textPrimary }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your Name"
                placeholderTextColor={theme.textMuted}
              />

              {/* Phone Number */}
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>PHONE NUMBER</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: theme.surfaceVariant, borderColor: theme.border, color: theme.textPrimary }]}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="+91 XXXXX XXXXX"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
              />

              {/* Municipal Ward / Locality */}
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>LOCALITY / MUNICIPAL WARD</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: theme.surfaceVariant, borderColor: theme.border, color: theme.textPrimary }]}
                value={editWard}
                onChangeText={setEditWard}
                placeholder="e.g. Ward 14, Lajpat Nagar"
                placeholderTextColor={theme.textMuted}
              />

              {/* Action Buttons */}
              <View style={styles.sheetBtnRow}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: theme.border }]}
                  onPress={() => setIsEditingProfile(false)}
                >
                  <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                  onPress={handleSaveProfile}
                >
                  <Text style={[styles.saveBtnText, { color: theme.textInverse }]}>Save Changes ✓</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sub-Screen Modal: About Earth Relief & Founder */}
      <Modal visible={activeSubScreen === 'about'} animationType="slide">
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <View style={[styles.subModalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setActiveSubScreen(null)} style={styles.backBtn}>
              <Text style={[styles.backBtnText, { color: theme.textPrimary }]}>← Back to Menu</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.aboutScroll}>
            {/* Header Hero */}
            <View style={styles.aboutHero}>
              <View style={[styles.aboutHeroBadge, { backgroundColor: theme.primaryContainer }]}>
                <AppLogo size={60} />
              </View>
              <Text style={[styles.aboutTitle, { color: theme.textPrimary }]}>Earth Relief India</Text>
              <Text style={[styles.aboutTagline, { color: theme.primary }]}>
                Biodegradable & Nature-Decomposable Alternatives
              </Text>
              <Text style={[styles.aboutRegNumber, { color: theme.textMuted }]}>
                Clean India Mission Partner • Greater Noida, Uttar Pradesh
              </Text>
            </View>

            {/* Founder Spotlight Card with Emotional Pain Points */}
            <View style={[styles.founderCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
              <View style={styles.founderTopRow}>
                <View style={[styles.founderAvatarCircle, { borderColor: theme.primary, backgroundColor: theme.surfaceVariant }]}>
                  <Text style={styles.founderEmoji}>👨‍💼</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.founderName, { color: theme.textPrimary }]}>Keshav Singh</Text>
                  <Text style={[styles.founderTitle, { color: theme.primary }]}>Founder & Visionary</Text>
                  <TouchableOpacity onPress={() => openLink(BRAND_INFO.founder.linkedin)}>
                    <Text style={[styles.founderLinkedInLink, { color: theme.secondary }]}>
                      🔗 View LinkedIn Profile ➔
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Founder's Emotional Narrative & The Pain Point */}
              <View style={[styles.narrativeBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                <Text style={[styles.narrativeHeading, { color: theme.critical }]}>⚠️ The Silent Environmental Crisis:</Text>
                <Text style={[styles.narrativeText, { color: theme.textSecondary }]}>
                  Every single day, thousands of tons of indestructible single-use plastics choke our Indian streets, block city storm drains, poison fertile agricultural soil, and release toxic carcinogenic fumes into our atmosphere when incinerated on roadside dumps.
                </Text>
                <Text style={[styles.narrativeText, { color: theme.textSecondary, marginTop: 8 }]}>
                  Deeply disturbed by this ecological tragedy, <Text style={{ fontWeight: '800', color: theme.textPrimary }}>Keshav Singh</Text> founded <Text style={{ fontWeight: '800', color: theme.primary }}>Earth Relief</Text> with an uncompromising mission: to eliminate single-use plastics by manufacturing 100% plant-based biodegradable and compostable alternatives that dissolve harmlessly back into nature as rich organic manure.
                </Text>
                <Text style={[styles.narrativeText, { color: theme.textSecondary, marginTop: 8 }]}>
                  <Text style={{ fontWeight: '800', color: theme.textPrimary }}>NearBin</Text> is our digital civic weapon—transforming every citizen with a smartphone into an active guardian of Swachh Bharat, pinpointing plastic dumpsites for swift municipal cleanup and scrap recycling.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.founderMailBtn, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}
                onPress={() => openLink(`mailto:${BRAND_INFO.founder.email}`)}
              >
                <Text style={styles.mailIcon}>✉️</Text>
                <Text style={[styles.founderMailText, { color: theme.textPrimary }]}>{BRAND_INFO.founder.email}</Text>
              </TouchableOpacity>
            </View>

            {/* Official Headquarters & Maps */}
            <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>HEADQUARTERS & LOCATION</Text>
            <View style={[styles.addressCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
              <View style={styles.addressRow}>
                <Text style={styles.addressPinIcon}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.addressText, { color: theme.textPrimary }]}>{BRAND_INFO.address}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.mapsActionBtn, { backgroundColor: theme.primary }]}
                onPress={() => openLink(BRAND_INFO.mapsUrl)}
                activeOpacity={0.85}
              >
                <Text style={styles.mapsBtnIcon}>🗺️</Text>
                <Text style={[styles.mapsBtnText, { color: theme.textInverse }]}>Open in Google Maps ➔</Text>
              </TouchableOpacity>
            </View>

            {/* Instant Contact Channels */}
            <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>DIRECT SUPPORT & ORDERS</Text>
            <View style={styles.contactGrid}>
              <TouchableOpacity
                style={[styles.contactCard, { backgroundColor: '#25D36615', borderColor: '#25D366' }]}
                onPress={() => openLink(BRAND_INFO.whatsappUrl)}
              >
                <Text style={styles.contactEmoji}>💬</Text>
                <Text style={[styles.contactTitle, { color: '#25D366' }]}>WhatsApp Us</Text>
                <Text style={[styles.contactValueText, { color: theme.textPrimary }]}>+91 78388 89588</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.contactCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}
                onPress={() => openLink(BRAND_INFO.phoneTel)}
              >
                <Text style={styles.contactEmoji}>📞</Text>
                <Text style={[styles.contactTitle, { color: theme.primary }]}>Direct Call</Text>
                <Text style={[styles.contactValueText, { color: theme.textPrimary }]}>+91 78388 89588</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.contactCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}
                onPress={() => openLink(`mailto:${BRAND_INFO.emails[0]}`)}
              >
                <Text style={styles.contactEmoji}>✉️</Text>
                <Text style={[styles.contactTitle, { color: theme.secondary }]}>Eco Desk</Text>
                <Text style={[styles.contactValueText, { color: theme.textPrimary }]}>{BRAND_INFO.emails[0]}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.contactCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}
                onPress={() => openLink(`mailto:${BRAND_INFO.emails[1]}`)}
              >
                <Text style={styles.contactEmoji}>🏢</Text>
                <Text style={[styles.contactTitle, { color: theme.primary }]}>General Inquiries</Text>
                <Text style={[styles.contactValueText, { color: theme.textPrimary }]}>{BRAND_INFO.emails[1]}</Text>
              </TouchableOpacity>
            </View>

            {/* Social Network & Repos */}
            <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>OFFICIAL CHANNELS & REPOSITORIES</Text>
            <View style={styles.socialsGrid}>
              {BRAND_INFO.socials.map((soc) => (
                <TouchableOpacity
                  key={soc.id}
                  style={[styles.socialChip, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}
                  onPress={() => openLink(soc.url)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.socialEmoji}>{soc.icon}</Text>
                  <Text style={[styles.socialLabel, { color: theme.textPrimary }]}>{soc.label}</Text>
                  <Text style={[styles.socialArrow, { color: theme.textMuted }]}>➔</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

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

      {/* Sub-Screen Modal: Privacy Policy */}
      <Modal visible={activeSubScreen === 'privacy'} animationType="slide">
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <View style={[styles.subModalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <TouchableOpacity onPress={() => setActiveSubScreen(null)} style={styles.backBtn}>
              <Text style={[styles.backBtnText, { color: theme.textPrimary }]}>← Back to Menu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openLink('https://nearbin.agriheal.in/privacy.html')}
              style={[styles.webLinkPill, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}
            >
              <Text style={[styles.webLinkPillText, { color: theme.primary }]}>Open Web Page ↗</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.legalScroll}>
            <View style={styles.legalHero}>
              <View style={[styles.legalHeroBadge, { backgroundColor: theme.primaryContainer }]}>
                <Text style={{ fontSize: 26 }}>🔒</Text>
              </View>
              <Text style={[styles.legalTitle, { color: theme.textPrimary }]}>Privacy Policy</Text>
              <Text style={[styles.legalMeta, { color: theme.textMuted }]}>
                Effective: Sept 7, 2026 • Earth Relief India
              </Text>
            </View>

            {/* Google OAuth & Limited Use Card */}
            <View style={[styles.legalCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
              <Text style={[styles.legalSectionHeading, { color: theme.primary }]}>1. Google User Data & Limited Use</Text>
              <Text style={[styles.legalBodyText, { color: theme.textSecondary }]}>
                When you sign in with Google, NearBin receives your name, email address, profile picture avatar, and Google account identifier to authenticate your civic profile and protect against false reports.
              </Text>
              <View style={[styles.legalCallout, { backgroundColor: 'rgba(41, 121, 255, 0.1)', borderColor: 'rgba(41, 121, 255, 0.3)' }]}>
                <Text style={[styles.legalCalloutTitle, { color: '#60A5FA' }]}>Google Limited Use Compliance</Text>
                <Text style={[styles.legalCalloutText, { color: theme.textPrimary }]}>
                  NearBin's use and transfer to any other app of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.
                </Text>
              </View>
              <Text style={[styles.legalBulletItem, { color: theme.textSecondary }]}>• We NEVER sell or monetize your Google account data.</Text>
              <Text style={[styles.legalBulletItem, { color: theme.textSecondary }]}>• We do NOT request or access sensitive Google Drive, Gmail, or Contact files.</Text>
              <Text style={[styles.legalBulletItem, { color: theme.textSecondary }]}>• Data is used strictly for identity verification and citizen Karma score security.</Text>
            </View>

            {/* GPS & Camera Card */}
            <View style={[styles.legalCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
              <Text style={[styles.legalSectionHeading, { color: theme.primary }]}>2. Location (GPS) & Camera Permissions</Text>
              <Text style={[styles.legalBulletItem, { color: theme.textSecondary }]}>
                • <Text style={{ fontWeight: '700', color: theme.textPrimary }}>GPS Coordinates:</Text> Captured with your explicit permission when logging a waste spot or opening the community heatmap to display accurate pins and guide Safai Mitras / kabadiwalas.
              </Text>
              <Text style={[styles.legalBulletItem, { color: theme.textSecondary }]}>
                • <Text style={{ fontWeight: '700', color: theme.textPrimary }}>Camera Access:</Text> Used solely to take real-time photos of public garbage piles or verify completed cleanups. Unrelated gallery photos are never accessed.
              </Text>
            </View>

            {/* Deletion & Retention */}
            <View style={[styles.legalCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
              <Text style={[styles.legalSectionHeading, { color: theme.primary }]}>3. Data Retention & Account Deletion</Text>
              <Text style={[styles.legalBodyText, { color: theme.textSecondary }]}>
                You have the full right to delete your account and personal data at any time. Email eco@earthrelief.in or earthrelief.india@gmail.com with the subject line "Account Deletion Request". We process all verified requests within 30 days.
              </Text>
            </View>

            {/* Contact Box */}
            <View style={[styles.legalCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
              <Text style={[styles.legalSectionHeading, { color: theme.primary }]}>4. Grievance & Organization Contact</Text>
              <Text style={[styles.legalBodyText, { color: theme.textPrimary, fontWeight: '700' }]}>Earth Relief India (NearBin Civic Platform)</Text>
              <Text style={[styles.legalBodyText, { color: theme.textSecondary }]}>Founder & Managing Director: Keshav Singh</Text>
              <Text style={[styles.legalBodyText, { color: theme.textSecondary }]}>Plot NO.08, Vill-Bishnulli, Dadri, Greater Noida, UP 203207</Text>
              <Text style={[styles.legalBodyText, { color: theme.textSecondary }]}>Helpline: +91 78388 89588 • Email: eco@earthrelief.in</Text>
            </View>

            <TouchableOpacity
              onPress={() => openLink('https://nearbin.agriheal.in/privacy.html')}
              style={[styles.openWebBtn, { backgroundColor: theme.primary }]}
            >
              <Text style={[styles.openWebBtnText, { color: theme.textInverse }]}>View Full Privacy Policy on Web ➔</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* Sub-Screen Modal: Terms & Conditions */}
      <Modal visible={activeSubScreen === 'terms'} animationType="slide">
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <View style={[styles.subModalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <TouchableOpacity onPress={() => setActiveSubScreen(null)} style={styles.backBtn}>
              <Text style={[styles.backBtnText, { color: theme.textPrimary }]}>← Back to Menu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openLink('https://nearbin.agriheal.in/terms.html')}
              style={[styles.webLinkPill, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}
            >
              <Text style={[styles.webLinkPillText, { color: theme.primary }]}>Open Web Page ↗</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.legalScroll}>
            <View style={styles.legalHero}>
              <View style={[styles.legalHeroBadge, { backgroundColor: theme.primaryContainer }]}>
                <Text style={{ fontSize: 26 }}>📜</Text>
              </View>
              <Text style={[styles.legalTitle, { color: theme.textPrimary }]}>Terms & Conditions</Text>
              <Text style={[styles.legalMeta, { color: theme.textMuted }]}>
                Effective: Sept 7, 2026 • Earth Relief India
              </Text>
            </View>

            <View style={[styles.legalCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
              <Text style={[styles.legalSectionHeading, { color: theme.primary }]}>1. Acceptance of Terms</Text>
              <Text style={[styles.legalBodyText, { color: theme.textSecondary }]}>
                By accessing or using NearBin, you agree to be bound by these terms established by Earth Relief India, founded by Keshav Singh. NearBin is an open civic tool supporting Swachh Bharat and local community sanitation.
              </Text>
            </View>

            <View style={[styles.legalCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
              <Text style={[styles.legalSectionHeading, { color: theme.primary }]}>2. Civic Reporting Integrity</Text>
              <Text style={[styles.legalBulletItem, { color: theme.textSecondary }]}>• Reports must reflect genuine public garbage hotspots.</Text>
              <Text style={[styles.legalBulletItem, { color: theme.textSecondary }]}>• Fabricating reports, uploading non-waste media, or gaming Karma points results in permanent account termination.</Text>
              <Text style={[styles.legalBulletItem, { color: theme.textSecondary }]}>• Users retain copyright in their photos and grant Earth Relief India a non-exclusive license to publish reports for municipal cleanup routing.</Text>
            </View>

            <View style={[styles.legalCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
              <Text style={[styles.legalSectionHeading, { color: theme.primary }]}>3. Safety & Limitation of Liability</Text>
              <Text style={[styles.legalBodyText, { color: theme.textSecondary }]}>
                Never enter private property or touch dangerous biohazard or industrial waste. NearBin coordinates civic awareness; actual cleanup response times depend on municipal corporations and urban local bodies.
              </Text>
              <Text style={[styles.legalBodyText, { color: theme.textSecondary, marginTop: 6 }]}>
                Jurisdiction: Gautam Buddha Nagar, Uttar Pradesh, India.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => openLink('https://nearbin.agriheal.in/terms.html')}
              style={[styles.openWebBtn, { backgroundColor: theme.primary }]}
            >
              <Text style={[styles.openWebBtnText, { color: theme.textInverse }]}>View Full Terms on Web ➔</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
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
    marginBottom: 12,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  avatarEmoji: {
    fontSize: 26,
  },
  profileMeta: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
  },
  userWard: {
    fontSize: 12,
    marginTop: 2,
  },
  userBadge: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  editProfileBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
    marginBottom: 12,
    gap: 8,
  },
  contactLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  contactValue: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  authProviderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  authProviderText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
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
  boosterCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  welcomeReward: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  referralCardBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  referralHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  referralIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  referralBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  referralCodeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  referralCodeBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  referralDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  referralLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 4,
    gap: 8,
  },
  referralLinkText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  referralCopyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  referralCopyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  referralFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 4,
  },
  referralStatsPill: {
    flex: 1,
  },
  referralStatsText: {
    fontSize: 11,
    fontWeight: '600',
  },
  referralShareBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  referralShareBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  adNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  boosterTextCol: {
    flex: 1,
  },
  boosterTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  boosterSub: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  claimText: {
    fontSize: 12,
    fontWeight: '900',
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
  brandHighlightCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  brandCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandLogoBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoIcon: {
    fontSize: 22,
  },
  brandCardTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  brandCardSub: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  brandSnippetText: {
    fontSize: 12,
    lineHeight: 18,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickChipEmoji: {
    fontSize: 13,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '800',
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
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  logoutIcon: {
    fontSize: 20,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
  },
  logoutSub: {
    fontSize: 11,
    marginTop: 1,
  },
  logoutArrow: {
    fontSize: 16,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  editSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    padding: 20,
    maxHeight: '80%',
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  sheetCloseText: {
    fontSize: 20,
    fontWeight: '800',
    padding: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 12,
  },
  inputField: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  sheetBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '900',
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
  aboutScroll: {
    padding: 18,
    gap: 14,
  },
  aboutHero: {
    alignItems: 'center',
    marginBottom: 10,
  },
  aboutHeroBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  aboutHeroIcon: {
    fontSize: 32,
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  aboutTagline: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  aboutRegNumber: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  founderCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  founderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  founderAvatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  founderEmoji: {
    fontSize: 26,
  },
  founderName: {
    fontSize: 18,
    fontWeight: '900',
  },
  founderTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  founderLinkedInLink: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  narrativeBox: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  narrativeHeading: {
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 6,
  },
  narrativeText: {
    fontSize: 12,
    lineHeight: 18,
  },
  founderMailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  mailIcon: {
    fontSize: 16,
  },
  founderMailText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addressCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  addressPinIcon: {
    fontSize: 20,
  },
  addressText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  mapsActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  mapsBtnIcon: {
    fontSize: 16,
  },
  mapsBtnText: {
    fontSize: 13,
    fontWeight: '900',
  },
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  contactCard: {
    width: '48%',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 4,
  },
  contactEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  contactTitle: {
    fontSize: 11,
    fontWeight: '800',
  },
  contactValueText: {
    fontSize: 11,
    fontWeight: '700',
  },
  socialsGrid: {
    gap: 8,
  },
  socialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  socialEmoji: {
    fontSize: 18,
  },
  socialLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
  },
  socialArrow: {
    fontSize: 14,
    fontWeight: '800',
  },
  webLinkPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
  },
  webLinkPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  legalScroll: {
    padding: 18,
    gap: 14,
  },
  legalHero: {
    alignItems: 'center',
    marginBottom: 8,
  },
  legalHeroBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  legalTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  legalMeta: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  legalCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  legalSectionHeading: {
    fontSize: 15,
    fontWeight: '800',
  },
  legalBodyText: {
    fontSize: 13,
    lineHeight: 20,
  },
  legalBulletItem: {
    fontSize: 13,
    lineHeight: 19,
    paddingLeft: 4,
  },
  legalCallout: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 6,
    marginVertical: 4,
  },
  legalCalloutTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  legalCalloutText: {
    fontSize: 12,
    lineHeight: 18,
  },
  openWebBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 6,
  },
  openWebBtnText: {
    fontSize: 14,
    fontWeight: '900',
  },
  govRankingCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    gap: 14,
  },
  govCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  govIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  govIcon: {
    fontSize: 24,
  },
  govTitleCol: {
    flex: 1,
  },
  govBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  govBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  govBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  govDistanceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  govCityName: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  govStateName: {
    fontSize: 12,
    marginTop: 2,
  },
  govGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
  },
  govGridItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  govGridRank: {
    fontSize: 18,
    fontWeight: '900',
  },
  govGridLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  govGridDivider: {
    width: 1,
    height: 28,
  },
  govPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  govPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  govPillIcon: {
    fontSize: 12,
  },
  govPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  govFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 12,
  },
  govNoteText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
  },
  govPortalBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  govPortalBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
});

