import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, DarkColors, LightColors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TUTORIAL_SLIDES = [
  {
    id: 'heatmap',
    emoji: '🗺️',
    badge: 'LIVE DENSITY MAPPING',
    badgeColor: '#FF3D00',
    title: 'Snapchat-Style Heatmap',
    description:
      'Explore live garbage hotspots on street-level Mappls maps. Glowing heat clusters turn from Red (Critical) to Green (Cleaned). Tap any hotspot to view chronological community stories!',
    featurePoint: '🔥 Real-time radial shaders & one-tap 18x GPS recenter',
  },
  {
    id: 'camera',
    emoji: '📸',
    badge: 'TAMPER-PROOF CIVIC PROOF',
    badgeColor: '#00E676',
    title: 'Live Camera with GPS Watermark',
    description:
      'Photograph dumpsites with zero image cropping. The app automatically imprints verified GPS coordinates, accuracy, and timestamp directly onto the photo for complete municipal transparency.',
    featurePoint: '📍 Authenticated latitude & longitude watermarking',
  },
  {
    id: 'multiselect',
    emoji: '🥤',
    badge: 'SMART CATEGORIZATION',
    badgeColor: '#2979FF',
    title: 'Multi-Category Selection',
    description:
      'Garbage piles are rarely one type. Easily tag multiple categories in a single report—such as Plastic, Wet Food, Scrap Metal, or Construction Debris—so sanitation squads come prepared.',
    featurePoint: '📦 Multi-tag selection with live count badge',
  },
  {
    id: 'portals',
    emoji: '🚜',
    badge: 'MULTI-ROLE ECOSYSTEM',
    badgeColor: '#FF9100',
    title: 'Govt Workers & Scrap Recyclers',
    description:
      'Municipal Safai Mitras receive priority cleanup queues and upload mandatory Before & After proof. Local Kabadiwalas use the Scrap Radar to reclaim cardboard and plastics before they reach landfills.',
    featurePoint: '♻️ Circular economy diverting waste from dumpsites',
  },
  {
    id: 'karma',
    emoji: '⭐',
    badge: 'CIVIC GAMIFICATION',
    badgeColor: '#FFD600',
    title: 'Earn Swachhata Karma',
    description:
      'Become a recognized Swachhata Champion in your city! Earn Karma points for verified reports and upvotes, climb the city rank leaderboard, and unlock civic badges.',
    featurePoint: '🇮🇳 Dedicated to Swachh Bharat Digital Mission',
  },
];

export default function OnboardingModal({ visible, onFinish, isDark = true }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const theme = isDark ? DarkColors : LightColors;
  const currentSlide = TUTORIAL_SLIDES[currentIndex];
  const isLast = currentIndex === TUTORIAL_SLIDES.length - 1;

  const handleNext = async () => {
    if (isLast) {
      await handleComplete();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem('@nearbin_tutorial_seen', 'true');
    } catch (e) {}
    if (onFinish) onFinish();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Top Header Row with Skip Button */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Text style={styles.brandLogo}>🌱 Near<Text style={{ color: theme.primary }}>Bin</Text></Text>
            <View style={[styles.stepPill, { backgroundColor: theme.surfaceVariant }]}>
              <Text style={[styles.stepText, { color: theme.textSecondary }]}>
                {currentIndex + 1} of {TUTORIAL_SLIDES.length}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.skipBtn, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]} onPress={handleComplete}>
            <Text style={[styles.skipBtnText, { color: theme.textSecondary }]}>Skip Tutorial ✕</Text>
          </TouchableOpacity>
        </View>

        {/* Slide Content */}
        <View style={styles.contentContainer}>
          {/* Main Visual Circle */}
          <View style={[styles.visualCircle, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
            <View style={[styles.innerGlow, { backgroundColor: `${currentSlide.badgeColor}22` }]}>
              <Text style={styles.visualEmoji}>{currentSlide.emoji}</Text>
            </View>
          </View>

          {/* Badge */}
          <View style={[styles.badgeContainer, { backgroundColor: `${currentSlide.badgeColor}18`, borderColor: currentSlide.badgeColor }]}>
            <Text style={[styles.badgeText, { color: currentSlide.badgeColor }]}>{currentSlide.badge}</Text>
          </View>

          {/* Title & Description */}
          <Text style={[styles.slideTitle, { color: theme.textPrimary }]}>{currentSlide.title}</Text>
          <Text style={[styles.slideDescription, { color: theme.textSecondary }]}>{currentSlide.description}</Text>

          {/* Highlight Feature Box */}
          <View style={[styles.highlightBox, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
            <Text style={[styles.highlightText, { color: theme.primary }]}>{currentSlide.featurePoint}</Text>
          </View>
        </View>

        {/* Footer Navigation Bar */}
        <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          {/* Dot Indicators */}
          <View style={styles.dotsRow}>
            {TUTORIAL_SLIDES.map((slide, idx) => (
              <TouchableOpacity key={slide.id} onPress={() => setCurrentIndex(idx)}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: idx === currentIndex ? theme.primary : theme.border,
                      width: idx === currentIndex ? 24 : 8,
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionButtonsRow}>
            {currentIndex > 0 ? (
              <TouchableOpacity
                style={[styles.navBtn, styles.backBtn, { borderColor: theme.border }]}
                onPress={handlePrev}
              >
                <Text style={[styles.backBtnText, { color: theme.textSecondary }]}>← Back</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            <TouchableOpacity
              style={[styles.navBtn, styles.nextBtn, { backgroundColor: theme.primary }]}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={[styles.nextBtnText, { color: theme.textInverse }]}>
                {isLast ? 'Get Started 🚀' : 'Next ➔'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 32,
    paddingBottom: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogo: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  stepPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  stepText: {
    fontSize: 11,
    fontWeight: '800',
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  skipBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
    paddingBottom: 20,
  },
  visualCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
  innerGlow: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualEmoji: {
    fontSize: 48,
  },
  badgeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  slideDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 18,
  },
  highlightBox: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  highlightText: {
    fontSize: 12,
    fontWeight: '800',
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    gap: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  navBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  nextBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
