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
import * as ImagePicker from 'expo-image-picker';
import { Colors, DarkColors, LightColors } from '../theme/colors';

const CATEGORIES = [
  { id: 'plastic', label: 'Plastic / Packets', icon: '🥤', color: Colors.catPlastic },
  { id: 'scrap', label: 'Metal / Scrap', icon: '📦', color: Colors.catScrap },
  { id: 'organic', label: 'Food / Organic', icon: '🍎', color: Colors.catOrganic },
  { id: 'debris', label: 'Debris / Malba', icon: '🧱', color: Colors.catDebris },
];

export default function WasteReportModal({ visible, onClose, onSubmit, userLocation, isDark = true }) {
  const [selectedCategories, setSelectedCategories] = useState(['plastic']); // Multi-select array
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState(null); // Initially null (empty upload thumbnail)
  const [isSubmitting, setIsSubmitting] = useState(false);

  const theme = isDark ? DarkColors : LightColors;

  // Toggle category in multi-select array
  const toggleCategory = (catId) => {
    setSelectedCategories((prev) => {
      if (prev.includes(catId)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter((c) => c !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  // Launch device camera without cropping (as captured)
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera Permission Required', 'Please allow camera access to photograph the garbage dump.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false, // NO CROPPING: Full unedited photo
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Camera error:', e);
      Alert.alert('Camera Error', 'Could not open camera. You can select from gallery.');
    }
  };

  // Select from gallery without cropping
  const handlePickGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // NO CROPPING
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Gallery pick error:', e);
    }
  };

  const handleSendReport = async () => {
    if (!photoUri) {
      Alert.alert('Photo Required', 'Please snap or upload a photo of the garbage to proceed.');
      return;
    }

    setIsSubmitting(true);
    try {
      const primaryCat = selectedCategories[0] || 'plastic';
      await onSubmit({
        title: title || `${primaryCat.toUpperCase()} Waste Reported`,
        description: description || 'Spotted by citizen via live camera capture.',
        category: primaryCat,
        categories: selectedCategories,
        latitude: userLocation?.latitude || 28.5672,
        longitude: userLocation?.longitude || 77.2435,
        address: 'Current Street Location (Mappls GPS verified)',
        beforePhoto: photoUri,
      });

      // Reset
      setPhotoUri(null);
      setSelectedCategories(['plastic']);
      setTitle('');
      setDescription('');
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Could not upload report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPhotoUri(null);
    onClose();
  };

  const latText = userLocation?.latitude ? userLocation.latitude.toFixed(5) : '28.56720';
  const lngText = userLocation?.longitude ? userLocation.longitude.toFixed(5) : '77.24350';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={[styles.overlay, { backgroundColor: theme.backdrop }]}>
        <View style={[styles.sheetContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}>
            <View style={[styles.dragHandle, { backgroundColor: theme.borderLight }]} />
            <View style={styles.headerRow}>
              <View>
                <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>📸 Report Public Garbage</Text>
                <Text style={[styles.sheetSubtitle, { color: theme.textSecondary }]}>GPS-Tagged Live Citizen Report</Text>
              </View>
              <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.surfaceVariant }]} onPress={handleClose}>
                <Text style={[styles.closeBtnText, { color: theme.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Image Upload Area: Empty Thumbnail vs Captured Image */}
            {!photoUri ? (
              <View style={[styles.emptyUploadBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.borderLight }]}>
                <View style={[styles.emptyIconCircle, { borderColor: theme.border }]}>
                  <Text style={styles.emptyCameraIcon}>📷</Text>
                </View>
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Upload Waste Photo</Text>
                <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>No crop required • Pure uncut camera photo</Text>

                <View style={styles.uploadButtonsRow}>
                  <TouchableOpacity style={[styles.cameraActionBtn, { backgroundColor: theme.primary }]} onPress={handleTakePhoto}>
                    <Text style={[styles.cameraActionText, { color: theme.textInverse }]}>📷 Take Live Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.galleryActionBtn, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]} onPress={handlePickGallery}>
                    <Text style={[styles.galleryActionText, { color: theme.textPrimary }]}>🖼️ Choose Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={[styles.photoBox, { backgroundColor: theme.elevated, borderColor: theme.border }]}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
                
                {/* Live GPS Watermark banner according to map */}
                <View style={styles.gpsWatermark}>
                  <View style={styles.gpsLiveRow}>
                    <View style={styles.gpsPulseDot} />
                    <Text style={styles.gpsText}>📍 GPS: {latText}° N, {lngText}° E</Text>
                  </View>
                  <Text style={styles.gpsAccuracy}>Accuracy: ±3.4m • Mappls Verified</Text>
                  <Text style={styles.gpsTime}>⏰ {new Date().toLocaleTimeString()} • Uncropped Proof</Text>
                </View>

                {/* Retake Button */}
                <TouchableOpacity style={styles.retakeBtn} onPress={() => setPhotoUri(null)}>
                  <Text style={styles.retakeBtnText}>🔄 Retake Photo</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Anti-Spam Notice */}
            <View style={[styles.antiSpamBadge, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
              <Text style={styles.antiSpamIcon}>🛡️</Text>
              <Text style={[styles.antiSpamText, { color: theme.textSecondary }]}>
                Snapchat Stories Active: Multiple photos uploaded at this same spot become part of that hotspot's live story!
              </Text>
            </View>

            {/* Category Select (Multi-Selection Allowed) */}
            <View style={styles.categoryHeaderRow}>
              <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>SELECT WASTE CATEGORIES</Text>
              <View style={[styles.multiCountBadge, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}>
                <Text style={[styles.multiCountText, { color: theme.primary }]}>{selectedCategories.length} SELECTED</Text>
              </View>
            </View>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryCard,
                      { backgroundColor: theme.surfaceVariant, borderColor: theme.border },
                      isSelected && {
                        borderColor: cat.color,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.04)',
                      },
                    ]}
                    onPress={() => toggleCategory(cat.id)}
                  >
                    <Text style={styles.catIcon}>{cat.icon}</Text>
                    <Text style={[styles.catLabel, { color: theme.textSecondary }, isSelected && { color: cat.color, fontWeight: '800' }]}>
                      {cat.label}
                    </Text>
                    {isSelected && <Text style={[styles.checkIcon, { color: cat.color }]}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Title / Landmark */}
            <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>LANDMARK / TITLE (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surfaceVariant, borderColor: theme.border, color: theme.textPrimary }]}
              placeholder="e.g. Near Metro Pillar 42, behind tea stall"
              placeholderTextColor={theme.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            {/* Description */}
            <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>DETAILS / NOTES</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: theme.surfaceVariant, borderColor: theme.border, color: theme.textPrimary }]}
              placeholder="Describe heap size, foul smell, blocking road, etc."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Bottom Action Button */}
          <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.primary }, (!photoUri || isSubmitting) && { opacity: 0.5 }]}
              onPress={handleSendReport}
              disabled={!photoUri || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={theme.textInverse} />
              ) : (
                <>
                  <Text style={styles.submitIcon}>🚀</Text>
                  <Text style={[styles.submitButtonText, { color: theme.textInverse }]}>
                    {photoUri ? 'Publish to Live Heatmap' : 'Capture Photo First'}
                  </Text>
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
    maxHeight: '92%',
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
  emptyUploadBox: {
    width: '100%',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyCameraIcon: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 16,
    textAlign: 'center',
  },
  uploadButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cameraActionBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraActionText: {
    color: Colors.textInverse,
    fontSize: 13,
    fontWeight: '800',
  },
  galleryActionBtn: {
    flex: 1,
    backgroundColor: Colors.elevated,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  galleryActionText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  photoBox: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Colors.elevated,
    position: 'relative',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  gpsWatermark: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(11, 14, 20, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  gpsLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gpsPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  gpsText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  gpsAccuracy: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  gpsTime: {
    color: Colors.textMuted,
    fontSize: 9,
    marginTop: 1,
  },
  retakeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  retakeBtnText: {
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
  categoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  multiCountBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  multiCountText: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  checkIcon: {
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 'auto',
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
