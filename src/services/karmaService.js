import { Platform, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WasteService } from './api';
import { isSupabaseConfigured, supabase } from './supabaseClient';

const APP_URL = 'https://nearbin.agriheal.in';

export const KarmaService = {
  /**
   * Claims the one-time +500 civic welcome bonus for an authenticated user.
   * Works smoothly with Firebase Google Auth, local accounts, and Supabase.
   */
  async claimWelcomeBonus(currentUser) {
    let targetUser = currentUser;

    // If currentUser is not passed directly, try retrieving from AsyncStorage
    if (!targetUser) {
      try {
        const raw = await AsyncStorage.getItem('@nearbin_user');
        if (raw) targetUser = JSON.parse(raw);
      } catch (e) {}
    }

    if (!targetUser) {
      throw new Error('Please sign in first to claim your Welcome Karma.');
    }

    if (targetUser.welcomeClaimedAt) {
      throw new Error('Welcome reward (+500 Karma) has already been claimed for this account.');
    }

    const nextKarma = (targetUser.karma || 0) + 500;
    const nowIso = new Date().toISOString();

    const updatedUser = {
      ...targetUser,
      karma: nextKarma,
      welcomeClaimedAt: nowIso,
    };

    // 1. Persist immediately to local cache
    try {
      await AsyncStorage.setItem('@nearbin_user', JSON.stringify(updatedUser));
      if (updatedUser.id) {
        await AsyncStorage.setItem(`@nearbin_user_karma_${updatedUser.id}`, String(nextKarma));
      }
    } catch (e) {
      console.log('[KarmaService] Local storage error:', e);
    }

    // 2. Sync to server in background
    WasteService.saveProfile(updatedUser).catch((err) => {
      console.log('[KarmaService] Profile server sync notice:', err);
    });

    // 3. If Supabase is available, sync to Supabase RPC gracefully without throwing
    if (isSupabaseConfigured && supabase) {
      supabase.rpc('claim_welcome_bonus').catch(() => {});
    }

    return { karma: nextKarma, user: updatedUser };
  },

  /**
   * Fetches latest karma balance for a user from storage and server.
   */
  async fetchUserKarma(user) {
    if (!user || !user.id) return user?.karma || 0;
    try {
      const storedKarma = await AsyncStorage.getItem(`@nearbin_user_karma_${user.id}`);
      if (storedKarma != null) {
        return parseInt(storedKarma, 10);
      }
      const remoteProfile = await WasteService.getProfile(user.id);
      if (remoteProfile && remoteProfile.karma != null) {
        return remoteProfile.karma;
      }
    } catch (e) {}
    return user.karma || 0;
  },

  async applyReferral(code, user) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.rpc('apply_referral', { inviter_code: code.trim().toUpperCase() });
        return { result: data, user };
      } catch (e) {}
    }
    return { result: 'referral_received', user };
  },

  referralUrl(user) {
    const code = user?.referralCode || user?.id?.slice(-6) || 'CITIZEN';
    return `${APP_URL}/?ref=${encodeURIComponent(code)}`;
  },

  async shareReferral(user) {
    const url = this.referralUrl(user);
    const message = 'Join me on NearBin! Geotag waste spots, help clean your neighbourhood, and earn civic Swachhata Karma points.';
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: 'Join NearBin', text: message, url });
      return;
    }
    await Share.share({ title: 'Join NearBin', message: `${message}\n${url}` });
  },
};

