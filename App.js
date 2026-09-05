import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Provider as PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, DarkColors, LightColors } from './src/theme/colors';
import { WasteService } from './src/services/api';

// Screens & Modals
import MapScreen from './src/screens/MapScreen';
import FeedScreen from './src/screens/FeedScreen';
import MenuScreen from './src/screens/MenuScreen';
import AuthModal from './src/components/AuthModal';
import OnboardingModal from './src/components/OnboardingModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState('map'); // 'map' | 'feed' | 'menu'
  const [isDark, setIsDark] = useState(true); // Dark / Light theme toggle
  const [hotspots, setHotspots] = useState([]);
  const [stats, setStats] = useState(null);
  const [userLocation, setUserLocation] = useState({ latitude: 28.5672, longitude: 77.2435 });
  
  // Mandatory User Authentication & Skippable Tutorial State
  const [user, setUser] = useState(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [tutorialVisible, setTutorialVisible] = useState(false);

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

  // Load hotspots & stats
  const loadData = async (coords = null) => {
    try {
      const loc = coords || userLocation;
      const data = await WasteService.getHotspots({ lat: loc.latitude, lng: loc.longitude });
      setHotspots(data || []);
      const s = await WasteService.getStats();
      setStats(s?.stats || null);
    } catch (e) {
      console.log('Error loading data:', e);
    }
  };

  // Check saved user session & load initial data
  useEffect(() => {
    (async () => {
      // 1. First-Time Skippable Tutorial Check
      try {
        const tutorialSeen = await AsyncStorage.getItem('@nearbin_tutorial_seen');
        if (!tutorialSeen) {
          setTutorialVisible(true);
        }
      } catch (e) {}

      // 2. Session check & instant server sync
      try {
        const saved = await AsyncStorage.getItem('@nearbin_user');
        if (saved) {
          const localUser = JSON.parse(saved);
          setUser(localUser);

          // Instantly sync latest profile from server
          if (localUser && localUser.id) {
            WasteService.getProfile(localUser.id).then((freshUser) => {
              if (freshUser) {
                setUser(freshUser);
                AsyncStorage.setItem('@nearbin_user', JSON.stringify(freshUser));
              }
            });
          }
        } else {
          setAuthModalVisible(true);
        }
      } catch (e) {
        setAuthModalVisible(true);
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

  // Auth Handlers with instant server sync
  const handleLoginSuccess = async (userData) => {
    setUser(userData);
    setAuthModalVisible(false);
    try {
      const serverUser = await WasteService.saveProfile(userData);
      if (serverUser) {
        setUser(serverUser);
        await AsyncStorage.setItem('@nearbin_user', JSON.stringify(serverUser));
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
    } catch (e) {}
    setUser(null);
    setAuthModalVisible(true);
  };

  // Citizen report submit
  const handleSubmitReport = async (reportData) => {
    const result = await WasteService.submitReport({
      ...reportData,
      reportedBy: user?.name || 'Citizen',
    });
    await loadData();
    return result;
  };

  // Upvote
  const handleUpvote = async (id) => {
    await WasteService.upvoteHotspot(id);
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

  // 3-Tab Bottom Navigation (Clean Stock Android M3)
  const TABS = [
    { id: 'map', label: 'Heatmap', icon: '🗺️' },
    { id: 'feed', label: 'Nearby Feed', icon: '📋' },
    { id: 'menu', label: 'Menu', icon: '⚙️' },
  ];

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: activeColors.background }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={activeColors.background}
        />

        {/* Screen Container */}
        <View style={styles.screenContainer}>
          {currentTab === 'map' && (
            <MapScreen
              hotspots={hotspots}
              currentRole="citizen"
              onUpvote={handleUpvote}
              onUpdateStatus={handleUpdateStatus}
              onClaimRecyclables={handleClaimRecyclables}
              onSubmitReport={handleSubmitReport}
              userLocation={userLocation}
              onRecenter={handleRecenter}
              isDark={isDark}
            />
          )}

          {currentTab === 'feed' && (
            <FeedScreen
              hotspots={hotspots}
              onUpvote={handleUpvote}
              onUpdateStatus={handleUpdateStatus}
              onClaimRecyclables={handleClaimRecyclables}
              currentRole="citizen"
              isDark={isDark}
            />
          )}

          {currentTab === 'menu' && (
            <MenuScreen
              stats={stats}
              isDark={isDark}
              onToggleTheme={() => setIsDark((prev) => !prev)}
              hotspots={hotspots}
              onUpdateStatus={handleUpdateStatus}
              onClaimRecyclables={handleClaimRecyclables}
              user={user}
              onUpdateProfile={handleUpdateProfile}
              onLogout={handleLogout}
              onReplayTutorial={() => setTutorialVisible(true)}
            />
          )}
        </View>

        {/* Stock Android Material 3 Bottom Navigation Bar */}
        <View style={[styles.bottomNav, { backgroundColor: activeColors.surface, borderTopColor: activeColors.border }]}>
          {TABS.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.navItem}
                onPress={() => setCurrentTab(tab.id)}
                activeOpacity={0.75}
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

        {/* Skippable First-Time Onboarding Walkthrough */}
        <OnboardingModal
          visible={tutorialVisible}
          onFinish={() => setTutorialVisible(false)}
          isDark={isDark}
        />

        {/* Mandatory Authentication Gate Modal (Google Sign-In / Phone OTP) */}
        {!tutorialVisible && (
          <AuthModal
            visible={authModalVisible || !user}
            onLoginSuccess={handleLoginSuccess}
            isDark={isDark}
          />
        )}
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
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
});
