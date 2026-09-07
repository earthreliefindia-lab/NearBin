import { Platform, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WasteService } from './api';
import { isSupabaseConfigured, supabase } from './supabaseClient';

const APP_URL = 'https://nearbin.agriheal.in';

export const KarmaService = {
  /**
   * Derives or retrieves a consistent referral code for a user.
   */
  getReferralCode(user) {
    if (user?.referralCode) return user.referralCode;
    const cleanId = (user?.id || user?.email || 'CITIZEN').replace(/[^a-zA-Z0-9]/g, '').slice(-5).toUpperCase();
    return `NB-${cleanId || 'INDIA'}`;
  },

  /**
   * Generates the personalized invite link for the user.
   */
  referralUrl(user) {
    const code = this.getReferralCode(user);
    return `${APP_URL}/?ref=${encodeURIComponent(code)}`;
  },

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
      referralCode: targetUser.referralCode || this.getReferralCode(targetUser),
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
   * Process invite referral on user registration or login.
   * Friend who joins receives +300 Karma points!
   * Referrer who shared the link receives +100 Karma points!
   */
  async processReferralOnJoin(user) {
    if (!user) return { user, rewarded: false };

    try {
      const pendingRef = await AsyncStorage.getItem('@nearbin_pending_ref');
      if (!pendingRef) return { user, rewarded: false };

      const myCode = this.getReferralCode(user);
      if (pendingRef.toUpperCase() === myCode.toUpperCase()) {
        // Cannot refer oneself
        await AsyncStorage.removeItem('@nearbin_pending_ref');
        return { user, rewarded: false };
      }

      // If already referred in the past, ignore
      if (user.referredBy) {
        await AsyncStorage.removeItem('@nearbin_pending_ref');
        return { user, rewarded: false };
      }

      // 1. Award +300 Karma to the new friend joining
      const nextKarma = (user.karma || 0) + 300;
      const updatedUser = {
        ...user,
        karma: nextKarma,
        referredBy: pendingRef.toUpperCase(),
        referralCode: user.referralCode || myCode,
      };

      await AsyncStorage.setItem('@nearbin_user', JSON.stringify(updatedUser));
      if (updatedUser.id) {
        await AsyncStorage.setItem(`@nearbin_user_karma_${updatedUser.id}`, String(nextKarma));
      }

      // 2. Record referral credit (+100 Karma) for the inviter
      const inviterKey = `@nearbin_ref_credits_${pendingRef.toUpperCase()}`;
      const existingCreditsRaw = await AsyncStorage.getItem(inviterKey);
      const existingCredits = existingCreditsRaw ? JSON.parse(existingCreditsRaw) : [];
      if (!existingCredits.includes(user.id || user.email)) {
        existingCredits.push(user.id || user.email);
        await AsyncStorage.setItem(inviterKey, JSON.stringify(existingCredits));
      }

      // Clean up pending ref flag
      await AsyncStorage.removeItem('@nearbin_pending_ref');

      // Sync updated user to server
      WasteService.saveProfile(updatedUser).catch(() => {});

      return {
        user: updatedUser,
        rewarded: true,
        bonusGranted: 300,
        referrerCode: pendingRef,
      };
    } catch (e) {
      console.log('[KarmaService] Referral processing error:', e);
      return { user, rewarded: false };
    }
  },

  /**
   * Fetches referral statistics (how many friends joined, bonus earned) for the inviter.
   */
  async fetchReferralStats(user) {
    if (!user) return { friendsJoined: 0, karmaEarned: 0 };
    try {
      const code = this.getReferralCode(user);
      const inviterKey = `@nearbin_ref_credits_${code.toUpperCase()}`;
      const creditsRaw = await AsyncStorage.getItem(inviterKey);
      const credits = creditsRaw ? JSON.parse(creditsRaw) : [];
      const count = credits.length;
      return {
        friendsJoined: count,
        karmaEarned: count * 100,
      };
    } catch (e) {
      return { friendsJoined: 0, karmaEarned: 0 };
    }
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

  async shareReferral(user) {
    const url = this.referralUrl(user);
    const code = this.getReferralCode(user);
    const message = `Join me on NearBin! Report public garbage with GPS camera proof, clean our city, and get 300 welcome Karma points using my invite link:\n${url}\n(Invite Code: ${code})`;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: 'Join NearBin & Earn 300 Karma', text: message, url });
      return;
    }
    await Share.share({ title: 'Join NearBin & Earn 300 Karma', message });
  },
};

