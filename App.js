import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Provider as PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { Colors } from './src/theme/colors';
import { WasteService } from './src/services/api';

// Screens
import MapScreen from './src/screens/MapScreen';
import FeedScreen from './src/screens/FeedScreen';
import WorkerScreen from './src/screens/WorkerScreen';
import ScrapPickerScreen from './src/screens/ScrapPickerScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    surface: Colors.surface,
  },
};

export default function App() {
  const [currentTab, setCurrentTab] = useState('map');
  const [currentRole, setCurrentRole] = useState('citizen');
  const [hotspots, setHotspots] = useState([]);
  const [stats, setStats] = useState(null);
  const [userLocation, setUserLocation] = useState({ latitude: 28.5672, longitude: 77.2435 });

  // Load initial hotspots & stats
  const loadData = async () => {
    try {
      const data = await WasteService.getHotspots();
      setHotspots(data || []);
      const s = await WasteService.getStats();
      setStats(s?.stats || null);
    } catch (e) {
      console.log('Error loading initial data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle citizen reporting
  const handleSubmitReport = async (reportData) => {
    const result = await WasteService.submitReport(reportData);
    await loadData();
    return result;
  };

  // Handle upvoting
  const handleUpvote = async (id) => {
    await WasteService.upvoteHotspot(id);
    await loadData();
  };

  // Handle status update (Govt Worker)
  const handleUpdateStatus = async (id, data) => {
    await WasteService.updateStatus(id, data);
    await loadData();
  };

  // Handle recyclables claim (Scrap Picker)
  const handleClaimRecyclables = async (id, claimedBy) => {
    await WasteService.claimRecyclables(id, claimedBy);
    await loadData();
  };

  // Stock Android Navigation Tabs
  const TABS = [
    { id: 'map', label: 'Heatmap', icon: '🗺️' },
    { id: 'feed', label: 'Feed', icon: '📋' },
    { id: 'worker', label: 'Safai Mitra', icon: '🚜', badge: hotspots.filter(h => h.status !== 'cleaned').length },
    { id: 'scrap', label: 'Scrap Radar', icon: '♻️' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

        {/* Screen Container */}
        <View style={styles.screenContainer}>
          {currentTab === 'map' && (
            <MapScreen
              hotspots={hotspots}
              currentRole={currentRole}
              onUpvote={handleUpvote}
              onUpdateStatus={handleUpdateStatus}
              onClaimRecyclables={handleClaimRecyclables}
              onSubmitReport={handleSubmitReport}
              userLocation={userLocation}
            />
          )}

          {currentTab === 'feed' && (
            <FeedScreen
              hotspots={hotspots}
              onUpvote={handleUpvote}
              onUpdateStatus={handleUpdateStatus}
              onClaimRecyclables={handleClaimRecyclables}
              currentRole={currentRole}
            />
          )}

          {currentTab === 'worker' && (
            <WorkerScreen
              hotspots={hotspots}
              onUpdateStatus={handleUpdateStatus}
            />
          )}

          {currentTab === 'scrap' && (
            <ScrapPickerScreen
              hotspots={hotspots}
              onClaimRecyclables={handleClaimRecyclables}
            />
          )}

          {currentTab === 'profile' && (
            <ProfileScreen
              currentRole={currentRole}
              onSelectRole={(role) => setCurrentRole(role)}
              stats={stats}
            />
          )}
        </View>

        {/* Stock Android Material 3 Bottom Navigation Bar */}
        <View style={styles.bottomNav}>
          {TABS.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.navItem}
                onPress={() => setCurrentTab(tab.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.navIconContainer, isActive && styles.navIconActive]}>
                  <Text style={styles.navIcon}>{tab.icon}</Text>
                  {!!tab.badge && tab.badge > 0 && (
                    <View style={styles.navBadge}>
                      <Text style={styles.navBadgeText}>{tab.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screenContainer: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
    width: 52,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  navIconActive: {
    backgroundColor: Colors.primaryContainer,
  },
  navIcon: {
    fontSize: 18,
  },
  navBadge: {
    position: 'absolute',
    top: -2,
    right: 6,
    backgroundColor: Colors.critical,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  navBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 3,
  },
  navLabelActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
});
