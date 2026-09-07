import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
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
  const [authMethod, setAuthMethod] = useState('phone'); // 'phone' | 'google'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpStep, setOtpStep] = useState(false); // false: enter phone, true: enter OTP
  const [otpCode, setOtpCode] = useState('');
  const [demoOtp, setDemoOtp] = useState('428190');
  const [isSimulated, setIsSimulated] = useState(!isFirebaseConfigured());
  const [confirmationResult, setConfirmationResult] = useState(null);
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
        Alert.alert('Sign-In Error', res.error || 'Unable to authenticate with Google.');
      }
    } catch (e) {
      setIsLoading(false);
      Alert.alert('Sign-In Error', 'Unable to authenticate with Google. Please try phone OTP.');
    }
  };

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    if (cleaned.length < 10) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await FirebaseAuthService.sendPhoneOtp(cleaned, 'recaptcha-container');
      setIsLoading(false);
      if (res.success) {
        setIsSimulated(Boolean(res.isSimulated));
        if (res.isSimulated) {
          setDemoOtp(res.demoCode);
          setOtpCode(res.demoCode);
        } else {
          setConfirmationResult(res.confirmationResult);
          setOtpCode('');
        }
        setOtpStep(true);
      } else {
        Alert.alert('OTP Error', res.error || 'Failed to dispatch SMS OTP.');
      }
    } catch (err) {
      setIsLoading(false);
      Alert.alert('OTP Dispatch Error', err.message || 'Error triggering SMS.');
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP sent to your number.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await FirebaseAuthService.verifyPhoneOtp(confirmationResult, otpCode, phoneNumber);
      setIsLoading(false);
      if (res.success && res.user) {
        await AsyncStorage.setItem('@nearbin_user', JSON.stringify(res.user));
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
      } else {
        Alert.alert('Verification Error', res.error || 'Could not verify OTP. Please try again.');
      }
    } catch (e) {
      setIsLoading(false);
      Alert.alert('Verification Error', 'Could not verify OTP. Please try again.');
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
            {/* Method Switcher Tabs */}
            <View style={[styles.tabRow, { backgroundColor: theme.surfaceVariant }]}>
              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  authMethod === 'phone' && [styles.tabBtnActive, { backgroundColor: theme.surfaceCard }],
                ]}
                onPress={() => {
                  setAuthMethod('phone');
                  setOtpStep(false);
                }}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    { color: authMethod === 'phone' ? theme.primary : theme.textMuted },
                    authMethod === 'phone' && { fontWeight: '800' },
                  ]}
                >
                  📱 Mobile OTP
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  authMethod === 'google' && [styles.tabBtnActive, { backgroundColor: theme.surfaceCard }],
                ]}
                onPress={() => setAuthMethod('google')}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    { color: authMethod === 'google' ? theme.primary : theme.textMuted },
                    authMethod === 'google' && { fontWeight: '800' },
                  ]}
                >
                  🌐 Google Sign-In
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB 1: PHONE OTP FLOW */}
            {authMethod === 'phone' && (
              <View style={styles.formContainer}>
                {!otpStep ? (
                  <>
                    <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>ENTER MOBILE NUMBER</Text>
                    <View style={[styles.phoneInputRow, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                      <View style={styles.countryCodeBox}>
                        <Text style={styles.flagIcon}>🇮🇳</Text>
                        <Text style={[styles.countryCodeText, { color: theme.textPrimary }]}>+91</Text>
                      </View>
                      <TextInput
                        style={[styles.phoneInput, { color: theme.textPrimary }]}
                        placeholder="98765 43210"
                        placeholderTextColor={theme.textMuted}
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                      />
                    </View>

                    <Text style={[styles.helperNote, { color: theme.textSecondary }]}>
                      We will send a 6-digit OTP SMS to verify your citizen identity for geotagged reports.
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.primaryActionBtn,
                        { backgroundColor: theme.primary },
                        (phoneNumber.length < 10 || isLoading) && { opacity: 0.55 },
                      ]}
                      onPress={handleSendOtp}
                      disabled={phoneNumber.length < 10 || isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color={theme.textInverse} />
                      ) : (
                        <Text style={[styles.primaryActionText, { color: theme.textInverse }]}>
                          Get OTP via SMS ➔
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {/* Step 2: OTP Verification Box */}
                    <View style={styles.otpHeaderRow}>
                      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>ENTER 6-DIGIT OTP</Text>
                      <TouchableOpacity onPress={() => setOtpStep(false)}>
                        <Text style={[styles.changeNumberText, { color: theme.primary }]}>Change Number</Text>
                      </TouchableOpacity>
                    </View>

                    {isSimulated ? (
                      <View style={[styles.demoOtpBadge, { backgroundColor: 'rgba(0, 230, 118, 0.12)', borderColor: theme.primary }]}>
                        <Text style={[styles.demoOtpText, { color: theme.primary }]}>
                          ⚡ Quick Mode Code: <Text style={{ fontWeight: '900' }}>{demoOtp}</Text>
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.demoOtpBadge, { backgroundColor: 'rgba(0, 176, 255, 0.12)', borderColor: theme.secondary }]}>
                        <Text style={[styles.demoOtpText, { color: theme.secondary }]}>
                          📩 SMS Sent via Firebase: Enter the 6-digit code received on your phone
                        </Text>
                      </View>
                    )}

                    <TextInput
                      style={[styles.otpInput, { backgroundColor: theme.surfaceVariant, borderColor: theme.primary, color: theme.textPrimary }]}
                      placeholder="• • • • • •"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otpCode}
                      onChangeText={setOtpCode}
                      textAlign="center"
                    />

                    <TouchableOpacity
                      style={[
                        styles.primaryActionBtn,
                        { backgroundColor: theme.primary },
                        (otpCode.length !== 6 || isLoading) && { opacity: 0.55 },
                      ]}
                      onPress={handleVerifyOtp}
                      disabled={otpCode.length !== 6 || isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color={theme.textInverse} />
                      ) : (
                        <Text style={[styles.primaryActionText, { color: theme.textInverse }]}>
                          Verify & Enter NearBin 🚀
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* TAB 2: GOOGLE SIGN-IN */}
            {authMethod === 'google' && (
              <View style={styles.formContainer}>
                <View style={styles.googleIntroBox}>
                  <Text style={[styles.googleIntroTitle, { color: theme.textPrimary }]}>
                    Instant One-Tap Access
                  </Text>
                  <Text style={[styles.googleIntroSub, { color: theme.textSecondary }]}>
                    Sign in with your Google account to automatically sync your Swachhata karma, verified spot badges, and municipal notifications.
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
                    <ActivityIndicator color={theme.primary} />
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
                    Official Google OAuth 2.0 • Data never shared with third parties
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
          {Platform.OS === 'web' && (
            <View nativeID="recaptcha-container" style={{ height: 0, overflow: 'hidden' }} />
          )}

          {/* Security & Free Setup Transparency Card */}
          <TouchableOpacity
            style={[styles.securityBadgeRow, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}
            onPress={() => setShowFirebaseInfo((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Text style={styles.securityBadgeIcon}>{isFirebaseConfigured() ? '🔒' : '⚙️'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.securityBadgeTitle, { color: theme.textPrimary }]}>
                {isFirebaseConfigured()
                  ? 'High Security Firebase Auth Active'
                  : 'Free Firebase SMS & Google OAuth Mode'}
              </Text>
              <Text style={[styles.securityBadgeSub, { color: theme.textSecondary }]}>
                {isFirebaseConfigured()
                  ? '10,000 free SMS/mo via Firebase • Bot brute-force protected'
                  : 'Tap to view free 10,000 SMS setup details (Zero Cost)'}
              </Text>
            </View>
            <Text style={{ color: theme.primary, fontWeight: '800' }}>{showFirebaseInfo ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showFirebaseInfo && (
            <View style={[styles.firebaseDetailsBox, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
              <Text style={[styles.fbDetailTitle, { color: theme.primary }]}>Free 10,000 SMS / Month Setup</Text>
              <Text style={[styles.fbDetailText, { color: theme.textSecondary }]}>
                1. Create a free project at <Text style={{ fontWeight: '700' }}>console.firebase.google.com</Text>
              </Text>
              <Text style={[styles.fbDetailText, { color: theme.textSecondary }]}>
                2. Under <Text style={{ fontWeight: '700' }}>Build ➔ Authentication</Text>, enable Phone and Google providers.
              </Text>
              <Text style={[styles.fbDetailText, { color: theme.textSecondary }]}>
                3. Paste the API key into <Text style={{ fontWeight: '700' }}>.env</Text> as <Text style={{ fontWeight: '700' }}>EXPO_PUBLIC_FIREBASE_API_KEY</Text>.
              </Text>
              <Text style={[styles.fbDetailText, { color: theme.textSecondary }]}>
                4. Firebase provides 10,000 SMS OTPs each month for +91 numbers at zero charge!
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
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoIcon: {
    fontSize: 34,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 14,
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
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  tabRow: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  formContainer: {
    gap: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  phoneInputRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    overflow: 'hidden',
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 6,
    borderRightWidth: 1,
    borderRightColor: '#3B4A6330',
  },
  flagIcon: {
    fontSize: 18,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '800',
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '700',
  },
  helperNote: {
    fontSize: 12,
    lineHeight: 17,
  },
  primaryActionBtn: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryActionText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  otpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changeNumberText: {
    fontSize: 12,
    fontWeight: '800',
  },
  demoOtpBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  demoOtpText: {
    fontSize: 12,
    fontWeight: '700',
  },
  otpInput: {
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 14,
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: '900',
  },
  googleIntroBox: {
    marginBottom: 6,
  },
  googleIntroTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  googleIntroSub: {
    fontSize: 12,
    lineHeight: 18,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
    marginTop: 8,
  },
  googleIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleGLetter: {
    fontSize: 16,
    fontWeight: '900',
    color: '#4285F4',
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  safetyGuaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginTop: 10,
  },
  safetyLockIcon: {
    fontSize: 12,
  },
  safetyText: {
    fontSize: 11,
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

