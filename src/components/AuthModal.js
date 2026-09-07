import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkColors, LightColors } from '../theme/colors';
import { FirebaseAuthService, isFirebaseConfigured } from '../services/firebaseAuth';

export default function AuthModal({ visible, onLoginSuccess, isDark = true }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showFirebaseInfo, setShowFirebaseInfo] = useState(false);

  const theme = isDark ? DarkColors : LightColors;

  // Google Sign-In Flow
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const res = await FirebaseAuthService.signInWithGoogle();
      setIsLoading(false);
      if (res.success && res.user) {
        await AsyncStorage.setItem('@nearbin_user', JSON.stringify(res.user));
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
      } else {
        if (res.error && !res.error.includes('popup-closed-by-user')) {
          Alert.alert('Google Sign-In', res.error || 'Unable to authenticate with Google.');
        }
      }
    } catch (e) {
      setIsLoading(false);
      Alert.alert('Sign-In Notice', 'Google authentication interrupted. Please try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.screen, { backgroundColor: theme.background }]}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Top Brand Header */}
          <View style={styles.brandContainer}>
            <View style={[styles.logoBadge, { backgroundColor: theme.primaryContainer }]}>
              <Text style={styles.logoIcon}>🌱</Text>
            </View>
            <Text style={[styles.appName, { color: theme.textPrimary }]}>
              Near<Text style={{ color: theme.primary }}>Bin</Text>
            </Text>
            <Text style={[styles.appTagline, { color: theme.textSecondary }]}>
              Civic Cleanliness & Live Waste Heatmap
            </Text>
            <View style={[styles.govtPledgeBanner, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
              <Text style={styles.pledgeEmoji}>🇮🇳</Text>
              <Text style={[styles.pledgeText, { color: theme.textSecondary }]}>
                Swachh Bharat Digital Mission Partner Portal
              </Text>
            </View>
          </View>

          {/* Auth Card */}
          <View style={[styles.authCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
            <View style={styles.formContainer}>
              <View style={styles.googleIntroBox}>
                <Text style={[styles.googleIntroTitle, { color: theme.textPrimary }]}>
                  Sign in with Google Account
                </Text>
                <Text style={[styles.googleIntroSub, { color: theme.textSecondary }]}>
                  One-tap secure access. Automatically sync your citizen profile, verified cleanliness reports, and community karma badges across all your devices.
                </Text>
              </View>

              {/* Google Branded Button */}
              <TouchableOpacity
                style={[styles.googleButton, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}
                onPress={handleGoogleSignIn}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.primary} size="small" />
                ) : (
                  <>
                    <View style={styles.googleIconCircle}>
                      <Text style={styles.googleGLetter}>G</Text>
                    </View>
                    <Text style={[styles.googleButtonText, { color: theme.textPrimary }]}>
                      Continue with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.safetyGuaranteeRow}>
                <Text style={styles.safetyLockIcon}>🔒</Text>
                <Text style={[styles.safetyText, { color: theme.textMuted }]}>
                  Official Google OAuth 2.0 • 256-Bit SSL Encrypted
                </Text>
              </View>

              {/* Feature Highlights */}
              <View style={[styles.featuresBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>📍</Text>
                  <Text style={[styles.featureText, { color: theme.textSecondary }]}>
                    Pin and report local waste hotspots with instant GPS tags
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>📸</Text>
                  <Text style={[styles.featureText, { color: theme.textSecondary }]}>
                    Live camera photo verification before & after municipal cleaning
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>🏆</Text>
                  <Text style={[styles.featureText, { color: theme.textSecondary }]}>
                    Earn Swachhata Karma points & city sanitation ranks
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Security Transparency Row */}
          <TouchableOpacity
            style={[styles.securityBadgeRow, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}
            onPress={() => setShowFirebaseInfo((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Text style={styles.securityBadgeIcon}>{isFirebaseConfigured() ? '🔒' : '⚙️'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.securityBadgeTitle, { color: theme.textPrimary }]}>
                {isFirebaseConfigured()
                  ? 'High Security Firebase Cloud Sync Active'
                  : 'Firebase OAuth Setup Mode'}
              </Text>
              <Text style={[styles.securityBadgeSub, { color: theme.textSecondary }]}>
                {isFirebaseConfigured()
                  ? 'Connected to nearbin-ba519 • Earth Relief India Lab'
                  : 'Tap to view cloud setup details'}
              </Text>
            </View>
            <Text style={{ color: theme.primary, fontWeight: '800' }}>{showFirebaseInfo ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showFirebaseInfo && (
            <View style={[styles.firebaseDetailsBox, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
              <Text style={[styles.fbDetailTitle, { color: theme.primary }]}>Cloud Account Architecture</Text>
              <Text style={[styles.fbDetailText, { color: theme.textSecondary }]}>
                • Google Auth Provider: <Text style={{ fontWeight: '700' }}>nearbin-ba519.firebaseapp.com</Text>
              </Text>
              <Text style={[styles.fbDetailText, { color: theme.textSecondary }]}>
                • Primary Owner: <Text style={{ fontWeight: '700' }}>earthrelief.india@gmail.com</Text>
              </Text>
              <Text style={[styles.fbDetailText, { color: theme.textSecondary }]}>
                • Domain Integration: <Text style={{ fontWeight: '700' }}>nearbin.agriheal.in</Text>
              </Text>
            </View>
          )}

          {/* Footer Terms */}
          <View style={styles.footerNote}>
            <Text style={[styles.footerText, { color: theme.textMuted }]}>
              By signing in, you support the civic movement for cleaner Indian streets and transparent municipal waste tracking.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoIcon: {
    fontSize: 36,
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  govtPledgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 14,
    gap: 8,
  },
  pledgeEmoji: {
    fontSize: 16,
  },
  pledgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  authCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  formContainer: {
    gap: 16,
  },
  googleIntroBox: {
    marginBottom: 4,
  },
  googleIntroTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  googleIntroSub: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
    marginTop: 8,
  },
  googleIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleGLetter: {
    fontSize: 17,
    fontWeight: '900',
    color: '#4285F4',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  safetyGuaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginTop: 4,
  },
  safetyLockIcon: {
    fontSize: 12,
  },
  safetyText: {
    fontSize: 11,
  },
  featuresBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginTop: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureIcon: {
    fontSize: 16,
  },
  featureText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  footerNote: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  securityBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  securityBadgeIcon: {
    fontSize: 18,
  },
  securityBadgeTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  securityBadgeSub: {
    fontSize: 10,
    marginTop: 2,
  },
  firebaseDetailsBox: {
    marginTop: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  fbDetailTitle: {
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 4,
  },
  fbDetailText: {
    fontSize: 11,
    lineHeight: 16,
  },
});

