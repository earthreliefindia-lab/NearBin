import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { Colors, CategoryMeta } from '../theme/colors';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per story

export default function StoryViewerModal({ visible, hotspot, onClose, onUpvote }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Derive photos list from hotspot (supports multiple story uploads)
  const photos = hotspot?.photos && hotspot.photos.length > 0
    ? hotspot.photos
    : [
        {
          uri: hotspot?.beforePhoto || 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600&auto=format&fit=crop&q=80',
          reportedBy: hotspot?.reportedBy || 'Concerned Citizen',
          reportedAt: hotspot?.reportedAt ? new Date(hotspot.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
          caption: hotspot?.title || 'Garbage Dump Spotted',
        },
        ...(hotspot?.afterPhoto
          ? [
              {
                uri: hotspot.afterPhoto,
                reportedBy: hotspot?.cleanedBy || 'Govt Safai Mitra',
                reportedAt: hotspot?.cleanedAt ? new Date(hotspot.cleanedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Cleaned',
                caption: '✨ Site Cleaned & Disinfected Proof',
                isCleaned: true,
              },
            ]
          : []),
      ];

  const totalStories = photos.length;
  const currentStory = photos[currentIndex] || photos[0];

  useEffect(() => {
    if (!visible) {
      setCurrentIndex(0);
      progressAnim.setValue(0);
      return;
    }

    progressAnim.setValue(0);
    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        if (currentIndex < totalStories - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          onClose();
        }
      }
    });

    return () => animation.stop();
  }, [visible, currentIndex, totalStories]);

  const handleNext = () => {
    if (currentIndex < totalStories - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (!visible || !hotspot) return null;

  const cat = CategoryMeta[hotspot.category] || CategoryMeta.plastic;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <StatusBar hidden />

        {/* Story Photo */}
        <Image
          source={{ uri: currentStory?.uri }}
          style={styles.storyImage}
          resizeMode="cover"
        />

        {/* Dark Gradient Overlays */}
        <View style={styles.topGradient} />
        <View style={styles.bottomGradient} />

        {/* Top Story Header & Segmented Progress Bars */}
        <View style={styles.topOverlay}>
          {/* Snapchat-style Segmented Progress Bar */}
          <View style={styles.progressBarRow}>
            {photos.map((_, i) => {
              let barWidth;
              if (i < currentIndex) {
                barWidth = '100%';
              } else if (i === currentIndex) {
                barWidth = progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                });
              } else {
                barWidth = '0%';
              }

              return (
                <View key={i} style={styles.progressBarTrack}>
                  <Animated.View style={[styles.progressBarFill, { width: barWidth }]} />
                </View>
              );
            })}
          </View>

          {/* User & Spot Info */}
          <View style={styles.headerInfoRow}>
            <View style={styles.authorBadge}>
              <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
              <View>
                <Text style={styles.authorName}>{currentStory?.reportedBy}</Text>
                <Text style={styles.storyTime}>
                  {currentStory?.reportedAt} • {hotspot?.address}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tap areas for Previous / Next Story */}
        <View style={styles.touchAreaContainer}>
          <TouchableOpacity style={styles.touchLeft} onPress={handlePrev} activeOpacity={1} />
          <TouchableOpacity style={styles.touchRight} onPress={handleNext} activeOpacity={1} />
        </View>

        {/* Bottom Story Footer */}
        <View style={styles.bottomOverlay}>
          <View style={styles.captionBox}>
            <View style={[styles.tagPill, { backgroundColor: cat.badgeBg, borderColor: cat.color }]}>
              <Text style={[styles.tagText, { color: cat.color }]}>{cat.label}</Text>
            </View>
            <Text style={styles.captionTitle}>{currentStory?.caption}</Text>
            <Text style={styles.coordsText}>
              📍 GPS: {hotspot.latitude?.toFixed(4)}, {hotspot.longitude?.toFixed(4)}
            </Text>
          </View>

          {/* Upvote & Story Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.upvoteBtn}
              onPress={() => onUpvote && onUpvote(hotspot.id)}
            >
              <Text style={styles.upvoteIcon}>🔥</Text>
              <Text style={styles.upvoteText}>Confirm Spot (+{hotspot.upvotes || 1})</Text>
            </TouchableOpacity>

            <View style={styles.storyCounter}>
              <Text style={styles.storyCounterText}>
                {currentIndex + 1} / {totalStories}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  storyImage: {
    width: width,
    height: height,
    position: 'absolute',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  topOverlay: {
    position: 'absolute',
    top: 16,
    left: 14,
    right: 14,
    zIndex: 20,
  },
  progressBarRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  progressBarTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  headerInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  storyTime: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  touchAreaContainer: {
    flex: 1,
    flexDirection: 'row',
    zIndex: 10,
  },
  touchLeft: {
    flex: 1,
  },
  touchRight: {
    flex: 2,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  captionBox: {
    marginBottom: 14,
  },
  tagPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  captionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 4,
  },
  coordsText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upvoteBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
  },
  upvoteIcon: {
    fontSize: 16,
  },
  upvoteText: {
    color: '#0B0E14',
    fontSize: 13,
    fontWeight: '800',
  },
  storyCounter: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  storyCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
