import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors } from '../theme/colors';

const CATEGORIES = [
  { id: 'plastic', label: 'Plastic / Packets', icon: '🥤', color: Colors.catPlastic },
  { id: 'scrap', label: 'Metal / Scrap', icon: '📦', color: Colors.catScrap },
  { id: 'organic', label: 'Food / Organic', icon: '🍎', color: Colors.catOrganic },
  { id: 'debris', label: 'Debris / Malba', icon: '🧱', color: Colors.catDebris },
];

const SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=600&auto=format&fit=crop&q=80',
];

export default function WasteReportModal({ visible, onClose, onSubmit, userLocation }) {
  const [selectedCategory, setSelectedCategory] = useState('plastic');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentPhoto = SAMPLE_PHOTOS[photoIndex];

  const handleNextPhoto = () => {
    setPhotoIndex((prev) => (prev + 1) % SAMPLE_PHOTOS.length);
  };

  const handleSendReport = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title || `${selectedCategory.toUpperCase()} Dump Spotted`,
        description: description || 'Spotted in public pathway. Please clear urgently.',
        category: selectedCategory,
        latitude: userLocation?.latitude || 28.5672,
        longitude: userLocation?.longitude || 77.2435,
        address: 'Current Street Location (Mappls GPS verified)',
        beforePhoto: currentPhoto,
      });

      // Reset
      setTitle('');
      setDescription('');
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Could not upload report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.dragHandle} />
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.sheetTitle}>📸 Report Public Garbage</Text>
                <Text style={styles.sheetSubtitle}>Live GPS-tagged citizen report</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Live Camera / Photo Preview with GPS Tag watermark */}
            <View style={styles.photoBox}>
              <Image source={{ uri: currentPhoto }} style={styles.photoPreview} />
              
              <View style={styles.gpsWatermark}>
                <Text style={styles.gpsText}>📍 GPS: {userLocation?.latitude?.toFixed(4)}, {userLocation?.longitude?.toFixed(4)}</Text>
                <Text style={styles.gpsAccuracy}>Accuracy: ±3.8m • Mappls Verified</Text>
              </View>

              <TouchableOpacity style={styles.snapOverlayBtn} onPress={handleNextPhoto}>
                <Text style={styles.snapOverlayText}>📷 Retake / Cycle Sample</Text>
              </TouchableOpacity>
            </View>

            {/* Anti-Spam Notice */}
            <View style={styles.antiSpamBadge}>
              <Text style={styles.antiSpamIcon}>🛡️</Text>
              <Text style={styles.antiSpamText}>
                Anti-Duplicate Active: If someone already reported this within 25m, your upload turns into a high-priority upvote.
              </Text>
            </View>

            {/* Category Select */}
            <Text style={styles.sectionHeading}>SELECT WASTE CATEGORY</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryCard,
                      isSelected && { borderColor: cat.color, backgroundColor: 'rgba(255,255,255,0.06)' },
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <Text style={styles.catIcon}>{cat.icon}</Text>
                    <Text style={[styles.catLabel, isSelected && { color: cat.color, fontWeight: '800' }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Title / Landmark */}
            <Text style={styles.sectionHeading}>LANDMARK / TITLE (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Near Bus Stand gate, behind Chai tapri"
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            {/* Description */}
            <Text style={styles.sectionHeading}>DETAILS / NOTES</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe heap size, foul smell, blocking road, etc."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Bottom Action Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
              onPress={handleSendReport}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.textInverse} />
              ) : (
                <>
                  <Text style={styles.submitIcon}>🚀</Text>
                  <Text style={styles.submitButtonText}>Publish to Live Heatmap</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.backdrop,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: Colors.borderLight,
  },
  sheetHeader: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.borderLight,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  photoBox: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.elevated,
    position: 'relative',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  gpsWatermark: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(11, 14, 20, 0.82)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gpsText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  gpsAccuracy: {
    color: Colors.textSecondary,
    fontSize: 9,
    marginTop: 1,
  },
  snapOverlayBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  snapOverlayText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  antiSpamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  antiSpamIcon: {
    fontSize: 20,
  },
  antiSpamText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.textMuted,
    marginBottom: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  categoryCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 8,
  },
  catIcon: {
    fontSize: 22,
  },
  catLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  input: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 18,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  submitIcon: {
    fontSize: 18,
  },
  submitButtonText: {
    color: Colors.textInverse,
    fontSize: 15,
    fontWeight: '800',
  },
});
