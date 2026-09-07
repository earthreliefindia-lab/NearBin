import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal, Linking } from 'react-native';
import { Colors } from '../theme/colors';
import AppLogo from './AppLogo';

export default function SmartInstallModal({ isDark = true, forceVisible = false, onClose }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deviceType, setDeviceType] = useState('unknown'); // 'android' | 'ios' | 'desktop'

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // Check if already in standalone installed mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone && !forceVisible) {
      return;
    }

    const ua = window.navigator.userAgent || '';
    const isAndroid = /android/i.test(ua);
    const isIOS = /iphone|ipad|ipod/i.test(ua);

    if (isAndroid) setDeviceType('android');
    else if (isIOS) setDeviceType('ios');
    else setDeviceType('desktop');

    // Android / Desktop Chrome beforeinstallprompt event
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      checkAndShowModal();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Initial check (for iOS and returning users)
    checkAndShowModal();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [forceVisible]);

  const checkAndShowModal = () => {
    if (forceVisible) {
      setModalVisible(true);
      return;
    }
    const dismissedTime = localStorage.getItem('nearbin_install_dismissed');
    const now = Date.now();
    // Only show if never dismissed or dismissed more than 24 hours ago
    if (!dismissedTime || now - parseInt(dismissedTime, 10) > 86400000) {
      // Delay display slightly for smooth page entry
      const timer = setTimeout(() => setModalVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[Install] User choice:', outcome);
      setDeferredPrompt(null);
      handleDismiss();
    } else {
      // Fallback instructions if prompt unavailable
      alert('To install: Tap your browser menu (⋮) and choose "Add to Home screen" or "Install App".');
    }
  };

  const handleDownloadAPK = () => {
    const apkUrl = './NearBin.apk';
    const a = document.createElement('a');
    a.href = apkUrl;
    a.download = 'NearBin.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    handleDismiss();
  };

  const handleDismiss = () => {
    setModalVisible(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('nearbin_install_dismissed', Date.now().toString());
    }
    if (onClose) onClose();
  };

  const isVisible = forceVisible || modalVisible;
  if (!isVisible) return null;

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={handleDismiss}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, isDark ? styles.darkCard : styles.lightCard]}>
          
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.brandBadge}>
              <AppLogo size={48} />
              <View>
                <Text style={[styles.brandTitle, isDark ? styles.textWhite : styles.textDark]}>
                  NearBin Lite App
                </Text>
                <Text style={styles.brandSub}>Official Civic Waste Heatmap</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Device-Specific Content */}
          {deviceType === 'android' && (
            <View style={styles.bodyContent}>
              <Text style={[styles.heading, isDark ? styles.textWhite : styles.textDark]}>
                Install on your Android Device
              </Text>
              <Text style={[styles.desc, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                Enjoy full-screen GPS reporting, instant Snapchat-style garbage heatmaps, and offline support right from your phone's App Drawer.
              </Text>

              <View style={styles.featurePills}>
                <Text style={styles.pill}>⚡ 0 MB Lite Version</Text>
                <Text style={styles.pill}>🚀 60 FPS Native Speed</Text>
                <Text style={styles.pill}>📱 Adds to App Menu</Text>
              </View>

              <View style={styles.buttonStack}>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleInstallPWA} activeOpacity={0.85}>
                  <Text style={styles.primaryBtnText}>⚡ Add to Home Screen (Instant PWA)</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryBtn} onPress={handleDownloadAPK} activeOpacity={0.85}>
                  <Text style={[styles.secondaryBtnText, isDark ? styles.textWhite : styles.textDark]}>
                    📥 Download Standalone APK (4 MB)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {deviceType === 'ios' && (
            <View style={styles.bodyContent}>
              <Text style={[styles.heading, isDark ? styles.textWhite : styles.textDark]}>
                Install on iPhone or iPad
              </Text>
              <Text style={[styles.desc, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                Install NearBin directly on your Apple device without going through the App Store:
              </Text>

              <View style={styles.iosStepsContainer}>
                <View style={styles.iosStep}>
                  <Text style={styles.stepNumber}>1</Text>
                  <Text style={[styles.stepText, isDark ? styles.textWhite : styles.textDark]}>
                    Tap the <Text style={styles.highlight}>Share button ⎋</Text> in Safari toolbar.
                  </Text>
                </View>
                <View style={styles.iosStep}>
                  <Text style={styles.stepNumber}>2</Text>
                  <Text style={[styles.stepText, isDark ? styles.textWhite : styles.textDark]}>
                    Scroll down and select <Text style={styles.highlight}>"Add to Home Screen" ➕</Text>.
                  </Text>
                </View>
                <View style={styles.iosStep}>
                  <Text style={styles.stepNumber}>3</Text>
                  <Text style={[styles.stepText, isDark ? styles.textWhite : styles.textDark]}>
                    Tap <Text style={styles.highlight}>Add</Text> in top right. NearBin is now installed!
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleDismiss} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Got It, Continue to Map</Text>
              </TouchableOpacity>
            </View>
          )}

          {deviceType === 'desktop' && (
            <View style={styles.bodyContent}>
              <Text style={[styles.heading, isDark ? styles.textWhite : styles.textDark]}>
                NearBin Web & Desktop Dashboard
              </Text>
              <Text style={[styles.desc, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                Full civic waste portal active on this browser. You can also install it as a native desktop application on Windows, Mac, or ChromeOS.
              </Text>

              <View style={styles.buttonStack}>
                {deferredPrompt ? (
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleInstallPWA} activeOpacity={0.85}>
                    <Text style={styles.primaryBtnText}>💻 Install NearBin Desktop App</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity style={styles.secondaryBtn} onPress={handleDownloadAPK} activeOpacity={0.85}>
                  <Text style={[styles.secondaryBtnText, isDark ? styles.textWhite : styles.textDark]}>
                    📱 Download Android APK for Mobile
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.textLinkBtn} onPress={handleDismiss}>
                  <Text style={[styles.textLink, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                    Continue in Web Browser &rarr;
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Footer Note */}
          <View style={styles.modalFooter}>
            <TouchableOpacity onPress={handleDismiss}>
              <Text style={[styles.dismissText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                Not now, browse website
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
    marginBottom: Platform.OS === 'web' ? 20 : 10,
  },
  darkCard: {
    backgroundColor: '#12181F',
    borderColor: '#24303A',
  },
  lightCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandIcon: {
    fontSize: 32,
    backgroundColor: '#00E676',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  brandSub: {
    fontSize: 12,
    color: '#00E676',
    fontWeight: '600',
  },
  closeBtn: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  bodyContent: {
    marginVertical: 4,
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  featurePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  pill: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    color: '#00E676',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    fontSize: 11,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  buttonStack: {
    gap: 10,
    marginTop: 4,
  },
  primaryBtn: {
    backgroundColor: '#00E676',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(0, 230, 118, 0.3)',
  },
  primaryBtnText: {
    color: '#0B0F12',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  textLinkBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  textLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  iosStepsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  iosStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00E676',
    color: '#000',
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  stepText: {
    fontSize: 13,
    flex: 1,
  },
  highlight: {
    fontWeight: '700',
    color: '#00E676',
  },
  modalFooter: {
    marginTop: 14,
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  textWhite: {
    color: '#F1F5F9',
  },
  textDark: {
    color: '#0F172A',
  },
  textMutedDark: {
    color: '#94A3B8',
  },
  textMutedLight: {
    color: '#64748B',
  },
});
