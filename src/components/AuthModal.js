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

export default function AuthModal({ visible, onLoginSuccess, isDark = true, onClose }) {
  const [isLoading, setIsLoading] = useState(false);

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
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContentWrapper}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={[styles.authCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
              {/* Close Button top-right */}
              {onClose && (
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: theme.surfaceVariant }]}
                  onPress={onClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.closeBtnText, { color: theme.textPrimary }]}>✕</Text>
                </TouchableOpacity>
              )}

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

              {/* Form Container */}
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

                {/* Explore Map First (Skip button) */}
                {onClose && (
                  <TouchableOpacity
                    style={[styles.exploreBtn, { borderColor: theme.border }]}
                    onPress={onClose}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.exploreBtnText, { color: theme.textSecondary }]}>
                      🗺️ Explore Live Heatmap First
                    </Text>
                  </TouchableOpacity>
                )}

                <View style={styles.safetyGuaranteeRow}>
                  <Text style={styles.safetyLockIcon}>🔒</Text>
                  <Text style={[styles.safetyText, { color: theme.textMuted }]}>
                    Official Google OAuth 2.0 • 256-Bit SSL Encrypted
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  modalContentWrapper: {
    width: '100%',
    maxWidth: 480,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoIcon: {
    fontSize: 34,
  },
  appName: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  govtPledgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 10,
    gap: 8,
  },
  pledgeEmoji: {
    fontSize: 15,
  },
  pledgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  authCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
    position: 'relative',
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
  exploreBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  exploreBtnText: {
    fontSize: 14,
    fontWeight: '600',
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

