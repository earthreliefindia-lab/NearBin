import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  useColorScheme,
  useWindowDimensions,
  Image,
  Alert,
} from 'react-native';
import { Provider as PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, DarkColors, LightColors } from './src/theme/colors';
import { WasteService } from './src/services/api';
import { FirebaseAuthService } from './src/services/firebaseAuth';
import { SupabaseAuthService } from './src/services/supabaseAuth';
import { isSupabaseConfigured } from './src/services/supabaseClient';
import { KarmaService } from './src/services/karmaService';

// Screens & Modals
import MapScreen from './src/screens/MapScreen';
import FeedScreen from './src/screens/FeedScreen';
import WorkerScreen from './src/screens/WorkerScreen';
import ScrapPickerScreen from './src/screens/ScrapPickerScreen';
import MenuScreen from './src/screens/MenuScreen';
import AuthModal from './src/components/AuthModal';
import OnboardingModal from './src/components/OnboardingModal';
import SmartInstallModal from './src/components/SmartInstallModal';
import AppLogo from './src/components/AppLogo';

export default function App() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 960;
  const systemColorScheme = useColorScheme();

  const [currentTab, setCurrentTab] = useState('map'); // 'map' | 'feed' | 'menu'
  const [isDark, setIsDark] = useState(false); // Clean Light Theme default

  const [hotspots, setHotspots] = useState([]);
  const [stats, setStats] = useState(null);
  const [userLocation, setUserLocation] = useState({ latitude: 28.5672, longitude: 77.2435 });
  
  // Mandatory User Authentication & Skippable Tutorial State
  const [user, setUser] = useState(null);
  const [votedHotspotIds, setVotedHotspotIds] = useState([]);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [installModalVisible, setInstallModalVisible] = useState(false);

  const activeColors = isDark ? DarkColors : LightColors;
  const paperTheme = isDark
    ? {
        ...MD3DarkTheme,
        colors: {
          ...MD3DarkTheme.colors,
          primary: DarkColors.primary,
          background: DarkColors.background,
          surface: DarkColors.surface,
        },
      }
    : {
        ...MD3LightTheme,
        colors: {
          ...MD3LightTheme.colors,
          primary: LightColors.primary,
          background: LightColors.background,
          surface: LightColors.surface,
        },
      };

  // Load hotspots & stats with silent background option
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (coords = null, silent = false) => {
    try {
      if (!silent) setIsRefreshing(true);
      const loc = coords || userLocation;
      const data = await WasteService.getHotspots({ lat: loc.latitude, lng: loc.longitude });
      if (Array.isArray(data)) {
        setHotspots(data);
      }
      const s = await WasteService.getStats();
      if (s?.stats) setStats(s.stats);
    } catch (e) {
      console.log('Error loading data:', e);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  // Theme toggle with persistence
  const handleToggleTheme = async () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    try {
      await AsyncStorage.setItem('@nearbin_theme', nextDark ? 'dark' : 'light');
    } catch (e) {}
  };

  // Check pending referral bonus when user joins
  const checkPendingReferral = async (currentUser) => {
    if (!currentUser) return;
    try {
      const res = await KarmaService.processReferralOnJoin(currentUser);
      if (res?.rewarded && res.user) {
        setUser(res.user);
        Alert.alert(
          '🎉 Referral Bonus Credited!',
          `You joined via invite code ${res.referrerCode}!\n\n+300 Swachhata Karma points have been added to your profile balance.`
        );
      }
    } catch (e) {
      console.log('Referral processing notice:', e);
    }
  };

  // Check saved user session & load initial data
  useEffect(() => {
    (async () => {
      // 0. Theme initialization (Saved preference > system preference > clean Light default)
      try {
        const savedTheme = await AsyncStorage.getItem('@nearbin_theme');
        if (savedTheme) {
          setIsDark(savedTheme === 'dark');
        } else if (systemColorScheme === 'dark') {
          setIsDark(true);
        } else {
          setIsDark(false);
        }
      } catch (e) {}

      // 0b. Load user's voted hotspot IDs (single vote restriction per user)
      try {
        const savedVoted = await AsyncStorage.getItem('@nearbin_voted_hotspots');
        if (savedVoted) {
          setVotedHotspotIds(JSON.parse(savedVoted));
        }
      } catch (e) {}

      // 0c. Capture referral code from URL query param if present (?ref=CODE)
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.search) {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const refCode = urlParams.get('ref');
          if (refCode && refCode.trim()) {
            await AsyncStorage.setItem('@nearbin_pending_ref', refCode.trim());
          }
        } catch (e) {}
      }

      // 1. Session check & non-blocking auth initialization
      try {
        const redirectLogin = await FirebaseAuthService.getRedirectedGoogleUser();
        if (redirectLogin?.success && redirectLogin.user) {
          let role = redirectLogin.user.role;
          if (!role) {
            try {
              role = (await AsyncStorage.getItem('@nearbin_selected_role')) || 'citizen';
            } catch (e) {
              role = 'citizen';
            }
          }
          const userWithRole = { ...redirectLogin.user, role };
          setUser(userWithRole);
          await AsyncStorage.setItem('@nearbin_user', JSON.stringify(userWithRole));
          WasteService.saveProfile(userWithRole).catch(() => {});
          checkPendingReferral(userWithRole);
        } else {
          const saved = await AsyncStorage.getItem('@nearbin_user');
          if (saved) {
            const localUser = JSON.parse(saved);
            setUser(localUser);
            checkPendingReferral(localUser);

            // Instantly sync latest profile from server if configured
            if (localUser && localUser.id) {
              WasteService.getProfile(localUser.id).then((freshUser) => {
                if (freshUser) {
                  setUser(freshUser);
                  AsyncStorage.setItem('@nearbin_user', JSON.stringify(freshUser));
                }
              }).catch(() => {});
            }
          } else {
            // Allow web view & map to fully render and display first, then gently pop up Google Sign-in overlay
            setTimeout(() => {
              setAuthModalVisible(true);
            }, 800);
          }
        }
      } catch (e) {
        setTimeout(() => {
          setAuthModalVisible(true);
        }, 800);
      }

      // 2. Data load
      await loadData();

      // 3. Location fetch
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (loc && loc.coords) {
            const currentCoords = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            };
            setUserLocation(currentCoords);
            await loadData(currentCoords);
          }
        }
      } catch (err) {
        console.log('Location acquisition skipped:', err?.message);
      }
    })();

    // Register PWA Service Worker for zero-glitch offline caching
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        const swPath = window.location.pathname.startsWith('/nearbin') ? '/nearbin/sw.js' : '/sw.js';
        navigator.serviceWorker
          .register(swPath)
          .then((reg) => console.log('[NearBin PWA] Service Worker registered:', reg.scope))
          .catch((err) => console.log('[NearBin PWA] SW registration notice:', err?.message));
      });
    }

    // 4. Live Real-Time Feed Synchronization — Instant SSE push + 2-second polling fallback
    let eventSource = null;
    let syncInterval = null;

    try {
      const apiBase = WasteService.getApiBase();
      if (apiBase && Platform.OS === 'web' && typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
        eventSource = new EventSource(`${apiBase}/events`);
        eventSource.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            const currentRole = user?.role || 'citizen';

            // Filter events by role so each user gets only relevant updates
            if (msg.type === 'hotspots_updated') {
              // Citizens see all updates; workers see status changes + new reports
              if (!msg.targetRole || msg.targetRole === 'all' || msg.targetRole === currentRole) {
                console.log(`[Realtime] Feed update → action=${msg.action} role=${currentRole}`);
                loadData(null, true);
              }
            }
            if (msg.type === 'recyclable_added' && currentRole === 'scrap_picker') {
              // Scrap pickers get instant notification of new recyclable spots
              console.log('[Realtime] New recyclable spot added — refreshing scrap radar...');
              loadData(null, true);
            }
          } catch (err) {}
        };
        eventSource.onerror = () => {
          // Browser handles automatic reconnect
        };
      }
    } catch (err) {
      console.warn('[Realtime] EventSource init notice:', err?.message);
    }

    // High-reliability 2-second polling fallback — all roles see instant updates
    syncInterval = setInterval(() => {
      loadData(null, true);
    }, 2000);

    return () => {
      if (eventSource) {
        try {
          eventSource.close();
        } catch (e) {}
      }
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, []);

  // Recenter button trigger
  const handleRecenter = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      if (loc && loc.coords) {
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setUserLocation(coords);
        await loadData(coords);
      }
    } catch (e) {
      console.log('Recenter error:', e);
    }
  };

  // Auth Handlers with instant server sync and karma preservation
  const handleLoginSuccess = async (userData) => {
    let mergedUser = { ...userData };
    try {
      const storedKarma = await AsyncStorage.getItem(`@nearbin_user_karma_${userData.id}`);
      if (storedKarma != null) {
        mergedUser.karma = Math.max(mergedUser.karma || 0, parseInt(storedKarma, 10));
      }
      const existingUserRaw = await AsyncStorage.getItem('@nearbin_user');
      if (existingUserRaw) {
        const existing = JSON.parse(existingUserRaw);
        if (existing.welcomeClaimedAt) {
          mergedUser.welcomeClaimedAt = existing.welcomeClaimedAt;
        }
        if (existing.karma && existing.karma > (mergedUser.karma || 0)) {
          mergedUser.karma = existing.karma;
        }
      }
    } catch (e) {}

    setUser(mergedUser);
    setAuthModalVisible(false);
    try {
      await AsyncStorage.setItem('@nearbin_user', JSON.stringify(mergedUser));
      const serverUser = await WasteService.saveProfile(mergedUser);
      if (serverUser) {
        setUser(serverUser);
        await AsyncStorage.setItem('@nearbin_user', JSON.stringify(serverUser));
        checkPendingReferral(serverUser);
      } else {
        checkPendingReferral(mergedUser);
      }
    } catch (e) {
      console.log('Login server sync error:', e);
    }
  };

  const handleUpdateProfile = async (updatedUser) => {
    setUser(updatedUser);
    try {
      await AsyncStorage.setItem('@nearbin_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.log('Error caching profile update:', e);
    }

    // Instantly sync to server
    try {
      const serverUser = await WasteService.saveProfile(updatedUser);
      if (serverUser) {
        setUser(serverUser);
        await AsyncStorage.setItem('@nearbin_user', JSON.stringify(serverUser));
      }
    } catch (err) {
      console.log('Server profile sync error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('@nearbin_user');
      await AsyncStorage.removeItem('@nearbin_selected_role');
      if (FirebaseAuthService && typeof FirebaseAuthService.signOut === 'function') {
        await FirebaseAuthService.signOut();
      }
      if (SupabaseAuthService && typeof SupabaseAuthService.signOut === 'function') {
        await SupabaseAuthService.signOut();
      }
    } catch (e) {
      console.log('Signout error:', e);
    }
    setUser(null);
    setCurrentTab('map');
    setAuthModalVisible(true);
  };

  const handleClaimWelcomeBonus = async () => {
    if (user && user.role !== 'citizen') {
      Alert.alert('Notice', 'Welcome karma rewards are exclusively available for citizen accounts.');
      return null;
    }
    const result = await KarmaService.claimWelcomeBonus(user);
    if (result && result.user) {
      const fresh = { ...result.user };
      setUser(fresh);
      try {
        await AsyncStorage.setItem('@nearbin_user', JSON.stringify(fresh));
        await WasteService.saveProfile(fresh);
      } catch (e) {}
    }
    return result;
  };

  const handleShareReferral = async () => KarmaService.shareReferral(user);

  // Citizen report submit with character-based Karma rewards (Citizens only)
  const handleSubmitReport = async (reportData) => {
    const isCitizen = !user || user.role === 'citizen';
    const charCount = reportData.characterCount ?? (reportData.description || '').trim().length;
    const notesBonus = Math.round(charCount * 0.5);
    const earnedKarma = isCitizen ? (reportData.notesKarma || (50 + notesBonus)) : 0;

    // ── OPTIMISTIC UPDATE: Add report to local state immediately ──────────────
    // This makes govt employees and recyclers see the new report INSTANTLY
    // without waiting for server confirmation (server will sync in background)
    const optimisticReport = {
      id: reportData.id || `nb-${Date.now().toString(36)}`,
      title: reportData.title || `${(reportData.category || 'Waste').toUpperCase()} Dump Reported`,
      description: reportData.description || 'Reported by citizen.',
      category: (reportData.category || 'plastic').toLowerCase(),
      status: 'reported',
      urgency: 'medium',
      upvotes: 1,
      latitude: parseFloat(reportData.latitude) || 28.5672,
      longitude: parseFloat(reportData.longitude) || 77.2435,
      address: reportData.address || 'GPS verified',
      beforePhoto: reportData.beforePhoto || null,
      afterPhoto: null,
      photos: reportData.photos || [],
      reportedBy: user?.name || 'Concerned Citizen',
      reportedAt: new Date().toISOString(),
      karmaAwarded: earnedKarma,
    };
    // Instantly push to the hotspots list visible to all roles
    setHotspots(prev => {
      const alreadyExists = prev.some(h => h.id === optimisticReport.id);
      return alreadyExists ? prev : [optimisticReport, ...prev];
    });
    // ──────────────────────────────────────────────────────────────────────────

    const result = await WasteService.submitReport({
      ...reportData,
      id: optimisticReport.id,
      reportedBy: user?.name || (user?.role === 'worker' ? 'Govt Official' : user?.role === 'scrap_picker' ? 'Kabadiwala' : 'Citizen'),
      karmaAwarded: earnedKarma,
    });

    if (user) {
      const nextKarma = isCitizen ? (user.karma || 0) + earnedKarma : (user.karma || 0);
      const nextReports = (user.verifiedReports || 0) + 1;
      const updatedUser = {
        ...user,
        karma: nextKarma,
        verifiedReports: nextReports,
      };
      setUser(updatedUser);
      await AsyncStorage.setItem('@nearbin_user', JSON.stringify(updatedUser));
      WasteService.saveProfile(updatedUser).catch(() => {});
    }

    // Replace optimistic entry with real server response if available
    if (result?.hotspot) {
      setHotspots(prev => prev.map(h => h.id === optimisticReport.id ? result.hotspot : h));
    }

    // Background sync to confirm all devices are in sync
    loadData(null, true);

    if (isCitizen) {
      Alert.alert(
        '🎉 Report Published!',
        `You earned +${earnedKarma} Swachhata Karma points!\n\n• Base Photo Reward: +50 Karma\n• Details & Notes Bonus (${charCount} chars): +${notesBonus} Karma\n\nThank you for keeping India clean!`
      );
    } else {
      Alert.alert(
        '✅ Hotspot Logged!',
        'The waste hotspot has been successfully updated on the live municipal map.'
      );
    }

    return result;
  };

  // Upvote / Single-vote per user restriction (Karma strictly for citizens)
  const handleUpvote = async (id) => {
    if (votedHotspotIds.includes(id)) {
      Alert.alert('Notice', 'You have already confirmed and voted for this spot.');
      return;
    }
    const voterId = user?.id || 'anon_device';
    const res = await WasteService.upvoteHotspot(id, voterId);
    if (res && res.alreadyVoted) {
      Alert.alert('Notice', 'You have already voted for this spot.');
      return;
    }

    const nextVoted = [...votedHotspotIds, id];
    setVotedHotspotIds(nextVoted);
    try {
      await AsyncStorage.setItem('@nearbin_voted_hotspots', JSON.stringify(nextVoted));
    } catch (e) {}

    // Civic engagement karma reward (+10 Karma for community vote, Citizens only)
    const isCitizen = !user || user.role === 'citizen';
    if (user && isCitizen) {
      const nextKarma = (user.karma || 0) + 10;
      const updatedUser = { ...user, karma: nextKarma };
      setUser(updatedUser);
      try {
        await AsyncStorage.setItem('@nearbin_user', JSON.stringify(updatedUser));
        WasteService.saveProfile(updatedUser).catch(() => {});
      } catch (e) {}
    }

    await loadData();
  };

  // Govt Worker clean proof update
  const handleUpdateStatus = async (id, data) => {
    await WasteService.updateStatus(id, data);
    await loadData();
  };

  // Kabadiwala scrap claim
  const handleClaimRecyclables = async (id, claimedBy) => {
    await WasteService.claimRecyclables(id, claimedBy);
    await loadData();
  };

  // 3-Tab Dynamic Navigation: Replaces "Nearby Feed" with the role's operational panel
  const isGovtWorker = user?.role === 'worker';
  const isKabadiwala = user?.role === 'scrap_picker';

  const middleTabConfig = isGovtWorker
    ? {
        id: 'feed',
        label: 'Govt Ops',
        desktopLabel: 'Govt Safai Portal',
        icon: '🚜',
        badgeCount: hotspots.filter((h) => h.status !== 'cleaned').length,
      }
    : isKabadiwala
    ? {
        id: 'feed',
        label: 'Scrap Radar',
        desktopLabel: 'Kabadi Scrap Radar',
        icon: '♻️',
        badgeCount: hotspots.filter((h) => ['plastic', 'scrap'].includes(h.category) && h.status !== 'cleaned').length,
      }
    : {
        id: 'feed',
        label: 'Nearby Feed',
        desktopLabel: 'Nearby Feed',
        icon: '📋',
        badgeCount: hotspots.length,
      };

  const TABS = [
    { id: 'map', label: 'Heatmap', icon: '🗺️' },
    { id: middleTabConfig.id, label: middleTabConfig.label, icon: middleTabConfig.icon },
    { id: 'menu', label: 'Menu', icon: '⚙️' },
  ];

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: activeColors.background }, isDesktop && { maxWidth: '100%' }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={activeColors.background}
        />

        {/* DESKTOP TOP NAVIGATION BAR (>960px Viewports) */}
        {isDesktop && (
          <View style={[styles.desktopHeader, { backgroundColor: activeColors.surface, borderBottomColor: activeColors.border }]}>
            <View style={styles.desktopBrandArea}>
              <View style={[styles.desktopLogoBadge, { backgroundColor: activeColors.primaryContainer }]}>
                <AppLogo size={28} />
              </View>
              <View>
                <Text style={[styles.desktopBrandTitle, { color: activeColors.textPrimary }]}>
                  Near<Text style={{ color: activeColors.primary }}>Bin</Text>
                </Text>
                <Text style={[styles.desktopBrandSub, { color: activeColors.textMuted }]}>
                  Swachh Bharat Live Heatmap
                </Text>
              </View>
            </View>

            {/* Desktop Navigation Tabs */}
            <View style={[styles.desktopTabContainer, { backgroundColor: activeColors.surfaceVariant, borderColor: activeColors.border }]}>
              <TouchableOpacity
                style={[styles.desktopTabBtn, currentTab === 'map' && [styles.desktopTabBtnActive, { backgroundColor: activeColors.surfaceCard }]]}
                onPress={() => setCurrentTab('map')}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 15 }}>🗺️</Text>
                <Text
                  style={[
                    styles.desktopTabText,
                    { color: currentTab === 'map' ? activeColors.primary : activeColors.textSecondary },
                    currentTab === 'map' && { fontWeight: '900' },
                  ]}
                >
                  Heatmap & Actions
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.desktopTabBtn, currentTab === 'feed' && [styles.desktopTabBtnActive, { backgroundColor: activeColors.surfaceCard }]]}
                onPress={() => {
                  setCurrentTab('feed');
                  loadData(null, true);
                }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 15 }}>{middleTabConfig.icon}</Text>
                <Text
                  style={[
                    styles.desktopTabText,
                    { color: currentTab === 'feed' ? activeColors.primary : activeColors.textSecondary },
                    currentTab === 'feed' && { fontWeight: '900' },
                  ]}
                >
                  {middleTabConfig.desktopLabel}
                </Text>
                {middleTabConfig.badgeCount > 0 && (
                  <View
                    style={[
                      styles.desktopBadgeCount,
                      {
                        backgroundColor: isGovtWorker
                          ? '#00B0FF'
                          : isKabadiwala
                          ? '#FF9100'
                          : activeColors.primary,
                      },
                    ]}
                  >
                    <Text style={[styles.desktopBadgeCountText, { color: activeColors.textInverse }]}>
                      {middleTabConfig.badgeCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.desktopTabBtn, currentTab === 'menu' && [styles.desktopTabBtnActive, { backgroundColor: activeColors.surfaceCard }]]}
                onPress={() => setCurrentTab('menu')}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 15 }}>⚙️</Text>
                <Text
                  style={[
                    styles.desktopTabText,
                    { color: currentTab === 'menu' ? activeColors.primary : activeColors.textSecondary },
                    currentTab === 'menu' && { fontWeight: '900' },
                  ]}
                >
                  Dashboard & Profile
                </Text>
              </TouchableOpacity>
            </View>

            {/* Desktop Action Pills (Theme, Install, User) */}
            <View style={styles.desktopRightActions}>
              <TouchableOpacity
                style={[styles.desktopActionPill, { backgroundColor: activeColors.surfaceVariant, borderColor: activeColors.border }]}
                onPress={handleToggleTheme}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 15 }}>{isDark ? '☀️' : '🌙'}</Text>
                <Text style={[styles.desktopActionText, { color: activeColors.textPrimary }]}>
                  {isDark ? 'Light' : 'Dark'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.desktopActionPill, { backgroundColor: activeColors.primaryContainer, borderColor: activeColors.primary }]}
                onPress={() => setInstallModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 15 }}>📲</Text>
                <Text style={[styles.desktopActionText, { color: activeColors.primary, fontWeight: '800' }]}>
                  Get Mobile App
                </Text>
              </TouchableOpacity>

              {user ? (
                <TouchableOpacity
                  style={[styles.desktopUserChip, { backgroundColor: activeColors.surfaceVariant, borderColor: activeColors.border }]}
                  onPress={() => setCurrentTab('menu')}
                  activeOpacity={0.8}
                >
                  {user.avatar && (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) ? (
                    <Image
                      source={{ uri: user.avatar }}
                      style={styles.desktopUserAvatarImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <AppLogo size={22} />
                  )}
                  <Text style={[styles.desktopUserName, { color: activeColors.textPrimary }]} numberOfLines={1}>
                    {user.name || 'Citizen'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.desktopActionPill, { backgroundColor: activeColors.surfaceVariant, borderColor: activeColors.border }]}
                  onPress={() => setAuthModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 14 }}>🔑</Text>
                  <Text style={[styles.desktopActionText, { color: activeColors.textPrimary }]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Screen Container */}
        <View style={styles.screenContainer}>
          {currentTab === 'map' && (
            <MapScreen
              hotspots={hotspots}
              currentRole={user?.role || 'citizen'}
              onUpvote={handleUpvote}
              onUpdateStatus={handleUpdateStatus}
              onClaimRecyclables={handleClaimRecyclables}
              onSubmitReport={handleSubmitReport}
              userLocation={userLocation}
              onRecenter={handleRecenter}
              isDark={isDark}
              isDesktop={isDesktop}
              onToggleTheme={handleToggleTheme}
              onOpenInstall={Platform.OS === 'web' ? () => setInstallModalVisible(true) : undefined}
              user={user}
              onRequireAuth={() => setAuthModalVisible(true)}
              votedHotspotIds={votedHotspotIds}
            />
          )}

          {currentTab === 'feed' && (
            <View style={[styles.feedTabContainer, isDesktop && styles.desktopCenteredTab]}>
              {isGovtWorker ? (
                <WorkerScreen
                  hotspots={hotspots}
                  onUpdateStatus={handleUpdateStatus}
                  user={user}
                  isDark={isDark}
                />
              ) : isKabadiwala ? (
                <ScrapPickerScreen
                  hotspots={hotspots}
                  onClaimRecyclables={handleClaimRecyclables}
                  user={user}
                  isDark={isDark}
                />
              ) : (
                <FeedScreen
                  hotspots={hotspots}
                  onUpvote={handleUpvote}
                  onUpdateStatus={handleUpdateStatus}
                  onClaimRecyclables={handleClaimRecyclables}
                  currentRole={user?.role || 'citizen'}
                  isDark={isDark}
                  userLocation={userLocation}
                  onOpenReport={() => setCurrentTab('map')}
                  votedHotspotIds={votedHotspotIds}
                  user={user}
                  onRefresh={() => loadData(null, false)}
                  isRefreshing={isRefreshing}
                />
              )}
            </View>
          )}

          {currentTab === 'menu' && (
            <View style={[styles.menuTabContainer, isDesktop && styles.desktopCenteredTab]}>
              <MenuScreen
                stats={stats}
                isDark={isDark}
                onToggleTheme={handleToggleTheme}
                hotspots={hotspots}
                onUpdateStatus={handleUpdateStatus}
                onClaimRecyclables={handleClaimRecyclables}
                user={user}
                onUpdateProfile={handleUpdateProfile}
                onLogout={handleLogout}
                onReplayTutorial={() => setTutorialVisible(true)}
                onOpenInstall={() => setInstallModalVisible(true)}
                onRequireAuth={() => setAuthModalVisible(true)}
                onClaimWelcomeBonus={handleClaimWelcomeBonus}
                onShareReferral={handleShareReferral}
                userLocation={userLocation}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            </View>
          )}
        </View>

        {/* Stock Android Material 3 Bottom Navigation Bar (Mobile Only) */}
        {!isDesktop && (
          <View style={[styles.bottomNav, { backgroundColor: activeColors.surface, borderTopColor: activeColors.border }]}>
            {TABS.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={styles.navItem}
                  onPress={() => {
                    setCurrentTab(tab.id);
                    if (tab.id === 'feed') {
                      loadData(null, true);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.navIconContainer,
                      isActive && { backgroundColor: activeColors.primaryContainer },
                    ]}
                  >
                    <Text style={styles.navIcon}>{tab.icon}</Text>
                  </View>
                  <Text
                    style={[
                      styles.navLabel,
                      { color: isActive ? activeColors.primary : activeColors.textMuted },
                      isActive && { fontWeight: '800' },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Optional Tutorial Walkthrough (Triggered from Menu) */}
        <OnboardingModal
          visible={tutorialVisible}
          onFinish={() => setTutorialVisible(false)}
          isDark={isDark}
        />

        {/* Floating Google Sign-In Overlay (Non-blocking: dismissed via close or skip) */}
        <AuthModal
          visible={authModalVisible}
          onLoginSuccess={handleLoginSuccess}
          onClose={() => setAuthModalVisible(false)}
          isDark={isDark}
        />

        {/* Universal Smart Install Popup (PWA, Android APK, iOS) */}
        <SmartInstallModal
          isDark={isDark}
          forceVisible={installModalVisible}
          onClose={() => setInstallModalVisible(false)}
        />
      </SafeAreaView>
    </PaperProvider>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 680 : undefined,
    alignSelf: 'center',
    // Allows a standalone iPhone PWA to keep content below the notch while
    // preserving the native SafeAreaView behaviour on Android and iOS apps.
    paddingTop: Platform.OS === 'web' ? 'env(safe-area-inset-top)' : 0,
  },
  screenContainer: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'web' ? 'calc(10px + env(safe-area-inset-bottom))' : Platform.OS === 'ios' ? 24 : 10,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navIconContainer: {
    width: 54,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 19,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  feedTabContainer: {
    flex: 1,
  },
  menuTabContainer: {
    flex: 1,
  },
  desktopCenteredTab: {
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
  },
  desktopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    zIndex: 100,
  },
  desktopBrandArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  desktopLogoBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopBrandTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  desktopBrandSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  desktopTabContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  desktopTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  desktopTabBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  desktopTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  desktopBadgeCount: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 2,
  },
  desktopBadgeCountText: {
    fontSize: 10,
    fontWeight: '900',
  },
  desktopRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  desktopActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  desktopActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  desktopUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    maxWidth: 180,
    overflow: 'hidden',
  },
  desktopUserAvatarImg: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  desktopUserName: {
    fontSize: 12,
    fontWeight: '800',
    maxWidth: 120,
  },
});
