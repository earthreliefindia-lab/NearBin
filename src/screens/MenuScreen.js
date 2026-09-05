import React, { useState } from 'react';
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
} from 'react-native';
import { Colors, DarkColors, LightColors } from '../theme/colors';
import WorkerScreen from './WorkerScreen';
import ScrapPickerScreen from './ScrapPickerScreen';

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
}) {
  const [activeSubScreen, setActiveSubScreen] = useState(null); // 'worker' | 'scrap' | 'about' | null
  const [isEditingProfile, setIsEditingProfile] = useState(false);

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

  const displayName = user?.name || 'Keshaw Sharma';
  const displayPhone = user?.phone || '+91 98765 43210';
  const displayWard = user?.ward || 'South Delhi Ward 14 - Malviya Nagar';
  const displayKarma = user?.karma ?? 480;
  const displayReports = user?.verifiedReports ?? 14;

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
              <Text style={styles.avatarEmoji}>{user?.avatar || '🇮🇳'}</Text>
            </View>
            <View style={styles.profileMeta}>
              <Text style={[styles.userName, { color: theme.textPrimary }]}>{displayName}</Text>
              <Text style={[styles.userWard, { color: theme.textSecondary }]} numberOfLines={1}>
                📍 {displayWard}
              </Text>
              <Text style={[styles.userBadge, { color: theme.primary }]}>⭐ Swachhata Champion</Text>
            </View>
            {/* Edit Profile Button */}
            <TouchableOpacity
              style={[styles.editProfileBtn, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}
              onPress={handleOpenEdit}
              activeOpacity={0.8}
            >
              <Text style={[styles.editProfileBtnText, { color: theme.primary }]}>✏️ Edit</Text>
            </TouchableOpacity>
          </View>

          {/* User Contact & Auth method badge */}
          <View style={[styles.contactRow, { borderTopColor: theme.border }]}>
            <Text style={[styles.contactLabel, { color: theme.textMuted }]}>Contact / ID:</Text>
            <Text style={[styles.contactValue, { color: theme.textPrimary }]}>{displayPhone}</Text>
            <View style={[styles.authProviderBadge, { backgroundColor: theme.primaryContainer }]}>
              <Text style={[styles.authProviderText, { color: theme.primary }]}>
                {user?.authProvider === 'google' ? 'Google' : 'Phone OTP'}
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

        {/* Account & Session Management */}
        <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>ACCOUNT & SESSION</Text>
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
                <Text style={styles.aboutHeroIcon}>🌱</Text>
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
    width: 52,
    height: 52,
    borderRadius: 26,
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
});
