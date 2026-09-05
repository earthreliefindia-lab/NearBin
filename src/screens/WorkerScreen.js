import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, CategoryMeta } from '../theme/colors';

const AFTER_SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80',
];

export default function WorkerScreen({ hotspots, onUpdateStatus }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [afterPhotoUri, setAfterPhotoUri] = useState(AFTER_SAMPLE_PHOTOS[0]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter tasks that need cleanup or are recently cleaned
  const pendingTasks = hotspots.filter((h) => h.status !== 'cleaned');
  const completedTasks = hotspots.filter((h) => h.status === 'cleaned');

  const [activeTab, setActiveTab] = useState('pending');
  const displayedTasks = activeTab === 'pending' ? pendingTasks : completedTasks;

  const handleOpenCleanModal = (task) => {
    setSelectedTask(task);
    setAfterPhotoUri(AFTER_SAMPLE_PHOTOS[0]);
    setIsModalVisible(true);
  };

  // Launch camera for worker proof
  const handleTakeProofPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission', 'Camera access needed to capture cleanup proof.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        aspect: [4, 3],
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setAfterPhotoUri(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Worker camera error:', e);
    }
  };

  const handleConfirmClean = async () => {
    if (!selectedTask) return;
    setIsLoading(true);
    try {
      await onUpdateStatus(selectedTask.id, {
        status: 'cleaned',
        cleanedBy: 'MCD Safai Mitra - Unit 9',
        afterPhoto: afterPhotoUri,
      });
      setIsModalVisible(false);
      setSelectedTask(null);
    } catch (e) {
      Alert.alert('Error', 'Could not update cleanup status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTask = async (task) => {
    setIsLoading(true);
    try {
      await onUpdateStatus(task.id, {
        status: 'in_progress',
        cleanedBy: 'MCD Safai Mitra - Unit 9',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const cat = CategoryMeta[item.category] || CategoryMeta.plastic;
    const isInProgress = item.status === 'in_progress';
    const isCleaned = item.status === 'cleaned';

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Image source={{ uri: item.beforePhoto }} style={styles.cardImg} />
          
          <View style={styles.cardInfo}>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: cat.badgeBg, borderColor: cat.color }]}>
                <Text style={[styles.badgeText, { color: cat.color }]}>{cat.label}</Text>
              </View>

              <View
                style={[
                  styles.badge,
                  isCleaned
                    ? { backgroundColor: Colors.lowContainer, borderColor: Colors.low }
                    : item.urgency === 'critical'
                    ? { backgroundColor: Colors.criticalContainer, borderColor: Colors.critical }
                    : { backgroundColor: Colors.highContainer, borderColor: Colors.high },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: isCleaned ? Colors.low : item.urgency === 'critical' ? Colors.critical : Colors.high },
                  ]}
                >
                  {isCleaned ? 'COMPLETED' : `${item.urgency.toUpperCase()} PRIORITY`}
                </Text>
              </View>
            </View>

            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.taskAddress}>📍 {item.address}</Text>
            <Text style={styles.upvoteAlert}>🔥 {item.upvotes} Citizen complaints registered</Text>
          </View>
        </View>

        {/* Worker Action Bar */}
        {!isCleaned ? (
          <View style={styles.actionRow}>
            {!isInProgress ? (
              <TouchableOpacity
                style={[styles.btn, styles.startBtn]}
                onPress={() => handleStartTask(item)}
              >
                <Text style={styles.btnText}>🚜 Start Work</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.inProgressPill}>
                <Text style={styles.inProgressText}>⚙️ In Progress</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.btn, styles.cleanBtn]}
              onPress={() => handleOpenCleanModal(item)}
            >
              <Text style={styles.cleanBtnText}>📸 Upload Proof & Resolve</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.completedNotice}>
            <Text style={styles.completedNoticeText}>
              ✅ Cleaned & Sanitized by {item.cleanedBy || 'Sanitation Team'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Govt Safai Mitra Panel</Text>
          <Text style={styles.subtitle}>Municipal Corporation Sanitation Dashboard</Text>
        </View>
        <View style={styles.dutyBadge}>
          <Text style={styles.dutyText}>ON DUTY</Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            ⚠️ Pending Hotspots ({pendingTasks.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            ✨ Resolved Sites ({completedTasks.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayedTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Clean Up Proof Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📸 Upload After-Cleanup Photo</Text>
            <Text style={styles.modalSubtitle}>
              Government compliance requires visual proof of cleaned and disinfected spot.
            </Text>

            <View style={styles.afterPhotoBox}>
              <Image source={{ uri: afterPhotoUri }} style={styles.afterImage} />
              <TouchableOpacity
                style={styles.cyclePhotoBtn}
                onPress={handleTakeProofPhoto}
              >
                <Text style={styles.cyclePhotoText}>📷 Snap Live Photo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.auditInfoBox}>
              <Text style={styles.auditText}>📌 Spot: {selectedTask?.title}</Text>
              <Text style={styles.auditText}>📍 Address: {selectedTask?.address}</Text>
              <Text style={styles.auditText}>⏰ Auto Timestamp: {new Date().toLocaleTimeString()}</Text>
            </View>

            <TouchableOpacity
              style={[styles.submitProofBtn, isLoading && { opacity: 0.6 }]}
              onPress={handleConfirmClean}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.textInverse} />
              ) : (
                <Text style={styles.submitProofText}>Confirm Site Cleaned & Closed</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dutyBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  dutyText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceVariant,
    padding: 6,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: Colors.surface,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.textPrimary,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 14,
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
  },
  cardImg: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  cardInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  taskAddress: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  upvoteAlert: {
    fontSize: 11,
    color: Colors.high,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  btn: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtn: {
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  inProgressPill: {
    backgroundColor: 'rgba(0, 176, 255, 0.15)',
    paddingHorizontal: 12,
    borderRadius: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  inProgressText: {
    color: Colors.secondary,
    fontSize: 11,
    fontWeight: '800',
  },
  cleanBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  cleanBtnText: {
    color: Colors.textInverse,
    fontSize: 12,
    fontWeight: '800',
  },
  completedNotice: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  completedNoticeText: {
    color: Colors.low,
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.backdrop,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginVertical: 6,
  },
  afterPhotoBox: {
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 14,
  },
  afterImage: {
    width: '100%',
    height: '100%',
  },
  cyclePhotoBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  cyclePhotoText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  auditInfoBox: {
    backgroundColor: Colors.surfaceVariant,
    padding: 12,
    borderRadius: 12,
    gap: 4,
    marginBottom: 16,
  },
  auditText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  submitProofBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  submitProofText: {
    color: Colors.textInverse,
    fontSize: 14,
    fontWeight: '800',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 6,
  },
  cancelBtnText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
