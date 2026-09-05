import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import { Colors, CategoryMeta } from '../theme/colors';
import BeforeAfterView from './BeforeAfterView';
import StoryViewerModal from './StoryViewerModal';

export default function HotspotDetailCard({
  hotspot,
  visible,
  onClose,
  currentRole = 'citizen',
  onUpvote,
  onUpdateStatus,
  onClaimRecyclables,
}) {
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);

  if (!hotspot) return null;

  const catInfo = CategoryMeta[hotspot.category] || CategoryMeta.plastic;
  const isCleaned = hotspot.status === 'cleaned';
  const isInProgress = hotspot.status === 'in_progress';

  // Role Action Handlers
  const handleUpvoteClick = async () => {
    setIsActionLoading(true);
    try {
      await onUpvote(hotspot.id);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStartCleanup = async () => {
    setIsActionLoading(true);
    try {
      await onUpdateStatus(hotspot.id, {
        status: 'in_progress',
        cleanedBy: 'MCD Safai Squad Team',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCompleteCleanup = async () => {
    setIsActionLoading(true);
    try {
      // Mock after photo URL
      await onUpdateStatus(hotspot.id, {
        status: 'cleaned',
        cleanedBy: 'Govt Safai Mitra - Ashok Kumar',
        afterPhoto: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&auto=format&fit=crop&q=80',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleClaimScrap = async () => {
    setIsActionLoading(true);
    try {
      await onClaimRecyclables(hotspot.id, 'Raju Kabadiwala (Scrap Recycler)');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header Tags */}
            <View style={styles.tagRow}>
              <View style={[styles.badge, { backgroundColor: catInfo.badgeBg, borderColor: catInfo.color }]}>
                <Text style={[styles.badgeText, { color: catInfo.color }]}>
                  {catInfo.label.toUpperCase()}
                </Text>
              </View>

              <View
                style={[
                  styles.badge,
                  isCleaned
                    ? { backgroundColor: Colors.lowContainer, borderColor: Colors.low }
                    : hotspot.urgency === 'critical'
                    ? { backgroundColor: Colors.criticalContainer, borderColor: Colors.critical }
                    : { backgroundColor: Colors.highContainer, borderColor: Colors.high },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color: isCleaned
                        ? Colors.low
                        : hotspot.urgency === 'critical'
                        ? Colors.critical
                        : Colors.high,
                    },
                  ]}
                >
                  {isCleaned ? 'CLEANED & VERIFIED' : `${hotspot.urgency.toUpperCase()} URGENCY`}
                </Text>
              </View>
            </View>

            {/* Title & Address */}
            <Text style={styles.title}>{hotspot.title}</Text>
            <Text style={styles.address}>📍 {hotspot.address}</Text>

            {/* Before vs After Photo Display */}
            <BeforeAfterView beforePhoto={hotspot.beforePhoto} afterPhoto={hotspot.afterPhoto} />

            {/* Snapchat Story Button */}
            <TouchableOpacity
              style={styles.storyBtn}
              onPress={() => setShowStoryModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.storyBtnEmoji}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.storyBtnTitle}>Snapchat Stories at this Spot</Text>
                <Text style={styles.storyBtnSubtitle}>Watch all citizen uploads as fullscreen stories</Text>
              </View>
              <Text style={styles.storyArrow}>▶</Text>
            </TouchableOpacity>

            {/* Description */}
            <Text style={styles.description}>{hotspot.description}</Text>

            {/* Meta Grid */}
            <View style={styles.metaBox}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>REPORTS & UPVOTES</Text>
                <Text style={styles.metaValue}>🔥 {hotspot.upvotes} Citizens Confirmed</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>STATUS</Text>
                <Text
                  style={[
                    styles.metaValue,
                    { color: isCleaned ? Colors.low : isInProgress ? Colors.medium : Colors.high },
                  ]}
                >
                  {isCleaned ? 'CLEANED' : isInProgress ? 'IN PROGRESS' : 'REPORTED'}
                </Text>
              </View>
            </View>

            {hotspot.cleanedBy && (
              <View style={styles.workerVerifiedBox}>
                <Text style={styles.workerVerifiedText}>
                  👷 Managed By: <Text style={{ color: Colors.textPrimary, fontWeight: '700' }}>{hotspot.cleanedBy}</Text>
                </Text>
              </View>
            )}

            {hotspot.claimedBy && (
              <View style={styles.scrapClaimedBox}>
                <Text style={styles.scrapClaimedText}>
                  ♻️ Claimed For Scrap Pickup By:{' '}
                  <Text style={{ color: Colors.textPrimary, fontWeight: '700' }}>{hotspot.claimedBy}</Text>
                </Text>
              </View>
            )}

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* Role-Specific Actions */}
          <View style={styles.actionContainer}>
            {/* 1. CITIZEN ROLE ACTIONS */}
            {currentRole === 'citizen' && (
              <TouchableOpacity
                style={[styles.primaryActionBtn, isActionLoading && { opacity: 0.6 }]}
                onPress={handleUpvoteClick}
                disabled={isActionLoading || isCleaned}
              >
                {isActionLoading ? (
                  <ActivityIndicator color={Colors.textInverse} />
                ) : (
                  <>
                    <Text style={styles.actionBtnIcon}>👍</Text>
                    <Text style={styles.primaryActionText}>
                      {isCleaned ? 'Cleaned Up Already' : 'Confirm Spot (+1 Upvote)'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* 2. GOVT WORKER ACTIONS */}
            {currentRole === 'worker' && (
              <View style={styles.workerActionRow}>
                {!isInProgress && !isCleaned && (
                  <TouchableOpacity
                    style={[styles.workerBtn, { backgroundColor: Colors.secondary }]}
                    onPress={handleStartCleanup}
                    disabled={isActionLoading}
                  >
                    <Text style={styles.workerBtnText}>🚜 Mark In-Progress</Text>
                  </TouchableOpacity>
                )}

                {!isCleaned && (
                  <TouchableOpacity
                    style={[styles.workerBtn, { backgroundColor: Colors.primary }]}
                    onPress={handleCompleteCleanup}
                    disabled={isActionLoading}
                  >
                    <Text style={[styles.workerBtnText, { color: Colors.textInverse }]}>
                      ✨ Upload Cleaned Proof
                    </Text>
                  </TouchableOpacity>
                )}

                {isCleaned && (
                  <View style={styles.cleanedBadgeBox}>
                    <Text style={styles.cleanedBadgeText}>✅ Site Cleared and Disinfected</Text>
                  </View>
                )}
              </View>
            )}

            {/* 3. SCRAP PICKER ACTIONS */}
            {currentRole === 'scrap' && (
              <TouchableOpacity
                style={[
                  styles.primaryActionBtn,
                  { backgroundColor: Colors.catScrap },
                  (hotspot.claimedBy || isCleaned) && { opacity: 0.5 },
                ]}
                onPress={handleClaimScrap}
                disabled={isActionLoading || !!hotspot.claimedBy || isCleaned}
              >
                <Text style={styles.actionBtnIcon}>📦</Text>
                <Text style={styles.primaryActionText}>
                  {hotspot.claimedBy ? 'Already Claimed' : 'Claim Scrap for Pickup'}
                </Text>
              </TouchableOpacity>
            )}

            {/* 4. ADMIN ROLE */}
            {currentRole === 'admin' && (
              <View style={styles.adminActionRow}>
                <TouchableOpacity style={styles.adminBtn} onPress={handleCompleteCleanup}>
                  <Text style={styles.adminBtnText}>Force Resolve</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.dismissBtn} onPress={onClose}>
              <Text style={styles.dismissBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <StoryViewerModal
        visible={showStoryModal}
        hotspot={hotspot}
        onClose={() => setShowStoryModal(false)}
        onUpvote={handleUpvoteClick}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.backdrop,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    padding: 20,
    borderTopWidth: 1,
    borderColor: Colors.borderLight,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.borderLight,
    alignSelf: 'center',
    marginBottom: 16,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 24,
    marginBottom: 6,
  },
  address: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginVertical: 10,
  },
  metaBox: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 14,
    padding: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  workerVerifiedBox: {
    backgroundColor: 'rgba(0, 176, 255, 0.12)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 176, 255, 0.3)',
    marginTop: 6,
  },
  workerVerifiedText: {
    fontSize: 12,
    color: Colors.secondary,
  },
  scrapClaimedBox: {
    backgroundColor: 'rgba(255, 145, 0, 0.12)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 145, 0, 0.3)',
    marginTop: 6,
  },
  scrapClaimedText: {
    fontSize: 12,
    color: Colors.catScrap,
  },
  actionContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  primaryActionBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnIcon: {
    fontSize: 18,
  },
  primaryActionText: {
    color: Colors.textInverse,
    fontSize: 15,
    fontWeight: '800',
  },
  workerActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  workerBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
  },
  cleanedBadgeBox: {
    flex: 1,
    backgroundColor: Colors.lowContainer,
    padding: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  cleanedBadgeText: {
    color: Colors.low,
    fontWeight: '800',
    fontSize: 13,
  },
  adminActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  adminBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceVariant,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  adminBtnText: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dismissBtnText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  storyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 61, 0, 0.12)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 0, 0.35)',
    marginVertical: 10,
    gap: 10,
  },
  storyBtnEmoji: {
    fontSize: 22,
  },
  storyBtnTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  storyBtnSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  storyArrow: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '900',
  },
});
