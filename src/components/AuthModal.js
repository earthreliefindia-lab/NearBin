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
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkColors, LightColors } from '../theme/colors';
import { FirebaseAuthService } from '../services/firebaseAuth';
import AppLogo from './AppLogo';

const ROLES = [
  {
    id: 'citizen',
    title: 'Citizen / Nagrik',
    badge: 'Civic Member',
    icon: '👤',
    subtitle: 'Report waste dumps, vote for cleanup, earn Swachhata Karma & invite friends',
    accentColor: '#00C853',
  },
  {
    id: 'worker',
    title: 'Government / Safai Mitra',
    badge: 'Municipal Squad',
    icon: '🏛️',
    subtitle: 'Municipal squad access • Mark in-progress, upload clean proof & resolve spots',
    accentColor: '#00B0FF',
  },
  {
    id: 'scrap_picker',
    title: 'Kabadiwala / Recycler',
    badge: 'Scrap Partner',
    icon: '♻️',
    subtitle: 'Recycler radar • Scan & claim high-value plastic, cardboard & metal scrap',
    accentColor: '#FF9100',
  },
];

export default function AuthModal({ visible, onLoginSuccess, isDark = true, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('citizen'); // 'citizen' | 'worker' | 'scrap_picker'

  const { width } = useWindowDimensions();
  // Split side-by-side on Web desktop/tablet (>= 680px); keep long single card on Android/mobile
  const isSplitLayout = Platform.OS === 'web' && width >= 680;

  const theme = isDark ? DarkColors : LightColors;

  // Google Sign-In Flow with Role Preservation
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.setItem('@nearbin_selected_role', selectedRole);
      const res = await FirebaseAuthService.signInWithGoogle();
      setIsLoading(false);
      if (res.success && res.user) {
        const userWithRole = {
          ...res.user,
          role: selectedRole,
        };
        await AsyncStorage.setItem('@nearbin_user', JSON.stringify(userWithRole));
        if (onLoginSuccess) {
          onLoginSuccess(userWithRole);
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

  const selectedRoleObj = ROLES.find((r) => r.id === selectedRole) || ROLES[0];

  const renderBrandHeader = (compact = false) => (
    <View style={[styles.brandContainer, compact && styles.brandContainerCompact]}>
      <View style={[styles.logoBadge, compact && styles.logoBadgeCompact, { backgroundColor: theme.primaryContainer }]}>
        <AppLogo size={compact ? 36 : 46} />
      </View>
      <Text style={[styles.appName, compact && styles.appNameCompact, { color: theme.textPrimary }]}>
        Near<Text style={{ color: theme.primary }}>Bin</Text>
      </Text>
      <Text style={[styles.appTagline, compact && { fontSize: 11 }, { color: theme.textSecondary }]}>
        Civic Cleanliness & Live Waste Heatmap
      </Text>
      <View style={[styles.govtPledgeBanner, compact && styles.govtPledgeBannerCompact, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
        <Text style={styles.pledgeEmoji}>🇮🇳</Text>
        <Text style={[styles.pledgeText, compact && { fontSize: 10 }, { color: theme.textSecondary }]}>
          Swachh Bharat Digital Mission Partner Portal
        </Text>
      </View>
    </View>
  );

  const renderRoleCard = (role, compact = false) => {
    const isSelected = selectedRole === role.id;
    return (
      <TouchableOpacity
        key={role.id}
        style={[
          styles.roleCard,
          compact && styles.roleCardCompact,
          {
            backgroundColor: isSelected
              ? (isDark ? 'rgba(0, 200, 83, 0.12)' : '#F0FDF4')
              : theme.surfaceVariant,
            borderColor: isSelected ? role.accentColor : theme.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => setSelectedRole(role.id)}
        activeOpacity={0.85}
      >
        <View
          style={[
            styles.roleIconCircle,
            compact && styles.roleIconCircleCompact,
            {
              backgroundColor: isSelected
                ? `${role.accentColor}25`
                : theme.surfaceCard,
            },
          ]}
        >
          <Text style={[styles.roleIconText, compact && { fontSize: 16 }]}>{role.icon}</Text>
        </View>

        <View style={styles.roleTextCol}>
          <View style={styles.roleTitleRow}>
            <Text
              style={[
                styles.roleTitleText,
                compact && { fontSize: 12 },
                { color: isSelected ? role.accentColor : theme.textPrimary },
              ]}
            >
              {role.title}
            </Text>
            <View
              style={[
                styles.roleBadge,
                {
                  borderColor: isSelected ? role.accentColor : theme.border,
                  backgroundColor: isSelected
                    ? `${role.accentColor}20`
                    : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeText,
                  { color: isSelected ? role.accentColor : theme.textMuted },
                ]}
              >
                {role.badge}
              </Text>
            </View>
          </View>
          <Text
            style={[styles.roleSubtitleText, compact && { fontSize: 10, lineHeight: 13 }, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {role.subtitle}
          </Text>
        </View>

        {/* Radio Check Indicator */}
        <View
          style={[
            styles.roleRadioCircle,
            compact && styles.roleRadioCircleCompact,
            { borderColor: isSelected ? role.accentColor : theme.border },
          ]}
        >
          {isSelected && (
            <View
              style={[
                styles.roleRadioInner,
                compact && styles.roleRadioInnerCompact,
                { backgroundColor: role.accentColor },
              ]}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderGoogleButton = () => (
    <TouchableOpacity
      style={[
        styles.googleButton,
        {
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderColor: selectedRoleObj.accentColor,
        },
      ]}
      onPress={handleGoogleSignIn}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={selectedRoleObj.accentColor} size="small" />
      ) : (
        <>
          <View style={styles.googleIconCircle}>
            <Text style={styles.googleGLetter}>G</Text>
          </View>
          <Text style={[styles.googleButtonText, { color: theme.textPrimary }]}>
            Continue as {selectedRoleObj.title.split(' ')[0]}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );

  const renderExploreButton = () => (
    onClose ? (
      <TouchableOpacity
        style={[styles.exploreBtn, { borderColor: theme.border }]}
        onPress={onClose}
        activeOpacity={0.75}
      >
        <Text style={[styles.exploreBtnText, { color: theme.textSecondary }]}>
          🗺️ Explore Live Heatmap First
        </Text>
      </TouchableOpacity>
    ) : null
  );

  const renderSafetyRow = () => (
    <View style={styles.safetyGuaranteeRow}>
      <Text style={styles.safetyLockIcon}>🔒</Text>
      <Text style={[styles.safetyText, { color: theme.textMuted }]}>
        Official Google OAuth 2.0 • 256-Bit SSL Encrypted
      </Text>
    </View>
  );

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
          style={[styles.modalContentWrapper, { maxWidth: isSplitLayout ? 780 : 440 }]}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* SINGLE CARD CONTAINER - NO OUTSIDE LAYOUT */}
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

              {isSplitLayout ? (
                /* WEB / DESKTOP: SPLIT 2-COLUMN INSIDE THE SINGLE CARD */
                <View style={styles.splitRow}>
                  {/* Left Column: Role Selection */}
                  <View style={[styles.splitLeftCol, { borderRightColor: theme.border }]}>
                    <Text style={[styles.roleSectionTitle, { color: theme.textMuted }]}>
                      STEP 1: SELECT YOUR ACCOUNT ROLE
                    </Text>
                    <Text style={[styles.splitColSubtitle, { color: theme.textSecondary }]}>
                      Select your operational role before signing in
                    </Text>

                    <View style={styles.roleSelectionContainer}>
                      {ROLES.map((role) => renderRoleCard(role, false))}
                    </View>
                  </View>

                  {/* Right Column: Brand, Google Login, Skip */}
                  <View style={styles.splitRightCol}>
                    {renderBrandHeader(false)}

                    <View style={styles.loginActionSection}>
                      <Text style={[styles.roleSectionTitle, { color: theme.textMuted }]}>
                        STEP 2: SIGN IN WITH GOOGLE
                      </Text>

                      <View
                        style={[
                          styles.roleConfirmationPill,
                          {
                            backgroundColor: `${selectedRoleObj.accentColor}18`,
                            borderColor: selectedRoleObj.accentColor,
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 16 }}>{selectedRoleObj.icon}</Text>
                        <Text style={[styles.roleConfirmationText, { color: selectedRoleObj.accentColor }]}>
                          Logging in as <Text style={{ fontWeight: '900' }}>{selectedRoleObj.title}</Text>
                        </Text>
                      </View>

                      {renderGoogleButton()}
                      {renderExploreButton()}
                      {renderSafetyRow()}
                    </View>
                  </View>
                </View>
              ) : (
                /* ANDROID & MOBILE: SINGLE LONG VERTICAL COLUMN INSIDE ONE CARD */
                <View style={styles.mobileColumn}>
                  {renderBrandHeader(true)}

                  <Text style={[styles.roleSectionTitle, { color: theme.textMuted }]}>
                    STEP 1: SELECT YOUR ACCOUNT ROLE
                  </Text>
                  <View style={styles.roleSelectionContainer}>
                    {ROLES.map((role) => renderRoleCard(role, true))}
                  </View>

                  <Text style={[styles.roleSectionTitle, { color: theme.textMuted, marginTop: 4 }]}>
                    STEP 2: SIGN IN WITH GOOGLE
                  </Text>
                  {renderGoogleButton()}
                  {renderExploreButton()}
                  {renderSafetyRow()}
                </View>
              )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'web' ? 20 : 10,
  },
  modalContentWrapper: {
    width: '100%',
    maxHeight: '94%',
  },
  scrollContent: {
    flexGrow: 0,
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  authCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  /* Split Layout for Desktop/Web */
  splitRow: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'center',
  },
  splitLeftCol: {
    flex: 1.15,
    borderRightWidth: 1,
    paddingRight: 20,
    justifyContent: 'center',
  },
  splitRightCol: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 4,
  },
  splitColSubtitle: {
    fontSize: 12,
    marginBottom: 10,
  },
  loginActionSection: {
    gap: 8,
    marginTop: 4,
  },
  roleConfirmationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 4,
  },
  roleConfirmationText: {
    fontSize: 12,
    fontWeight: '700',
  },
  /* Mobile Single-Column Layout */
  mobileColumn: {
    gap: 10,
  },
  /* Brand Header */
  brandContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  brandContainerCompact: {
    marginBottom: 8,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  logoBadgeCompact: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginBottom: 4,
  },
  appName: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  appNameCompact: {
    fontSize: 22,
  },
  appTagline: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  govtPledgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    gap: 6,
  },
  govtPledgeBannerCompact: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginTop: 5,
  },
  pledgeEmoji: {
    fontSize: 13,
  },
  pledgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  /* Step 1: Role Selection Styles */
  roleSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  roleSelectionContainer: {
    gap: 8,
    marginBottom: 4,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
  },
  roleCardCompact: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 8,
  },
  roleIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconCircleCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  roleIconText: {
    fontSize: 18,
  },
  roleTextCol: {
    flex: 1,
    minWidth: 0,
  },
  roleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  roleTitleText: {
    fontSize: 13,
    fontWeight: '800',
    flexShrink: 1,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  roleSubtitleText: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },
  roleRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  roleRadioCircleCompact: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  roleRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  roleRadioInnerCompact: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  /* Google Button */
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
    marginTop: 2,
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
  /* Explore & Safety */
  exploreBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  exploreBtnText: {
    fontSize: 13,
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
});
