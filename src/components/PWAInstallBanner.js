import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors } from '../theme/colors';

export default function PWAInstallBanner({ isDark = true }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // Check if running in standalone mode already
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      return; // Already installed as PWA or in WebView shell
    }

    // Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(ua);
    if (isAppleMobile) {
      setIsIOS(true);
      // Only show if not dismissed in this session
      const dismissed = sessionStorage.getItem('nearbin_pwa_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
      return;
    }

    // Android / Desktop Chrome `beforeinstallprompt`
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = sessionStorage.getItem('nearbin_pwa_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] User choice:', outcome);
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem('nearbin_pwa_dismissed', 'true');
    }
  };

  if (!showBanner) return null;

  return (
    <View style={[styles.container, isDark ? styles.darkBg : styles.lightBg]}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>🌱</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, isDark ? styles.textWhite : styles.textDark]}>
            Install NearBin App
          </Text>
          <Text style={[styles.subtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
            {isIOS
              ? 'Tap "Share" ⎋ and "Add to Home Screen" for full-screen mode.'
              : 'Add to Home Screen for fast, glitch-free offline access.'}
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        {!isIOS && deferredPrompt && (
          <TouchableOpacity style={styles.installBtn} onPress={handleInstallClick} activeOpacity={0.8}>
            <Text style={styles.installBtnText}>Install Now</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss} activeOpacity={0.7}>
          <Text style={[styles.dismissBtnText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
            Dismiss
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 75,
    left: 12,
    right: 12,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 9999,
  },
  darkBg: {
    backgroundColor: '#141B20',
    borderColor: '#00E676',
  },
  lightBg: {
    backgroundColor: '#FFFFFF',
    borderColor: '#00E676',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#00E676',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textDark: {
    color: '#121212',
  },
  textMutedDark: {
    color: '#94A3B8',
  },
  textMutedLight: {
    color: '#64748B',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  installBtn: {
    backgroundColor: '#00E676',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 9999,
  },
  installBtnText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 12,
  },
  dismissBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  dismissBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
