import { Platform } from 'react-native';
import { requireSupabase, supabase } from './supabaseClient';

const joinedAt = () => new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

const toNearBinUser = (authUser, profile = {}) => ({
  id: authUser.id,
  name: profile.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'Google Citizen',
  email: authUser.email || '',
  phone: profile.phone || authUser.phone || '',
  avatar: profile.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
  authProvider: 'supabase_google',
  ward: profile.ward || 'Municipal Ward - Geotagged Zone',
  role: profile.role || 'citizen',
  // A profile starts at zero. Karma can only change through protected RPCs.
  karma: Number(profile.karma_points || 0),
  verifiedReports: Number(profile.verified_reports || 0),
  welcomeClaimedAt: profile.welcome_claimed_at || null,
  referralCode: profile.referral_code || '',
  joinedAt: profile.joined_at ? new Date(profile.joined_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : joinedAt(),
});

const getProfile = async (user) => {
  const client = requireSupabase();
  const { data, error } = await client.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  return data || {};
};

export const SupabaseAuthService = {
  async getCurrentUser() {
    if (!supabase) return null;
    const { data: { user } = {} } = await supabase.auth.getUser();
    if (!user) return null;
    await this.bootstrapProfile(user);
    return toNearBinUser(user, await getProfile(user));
  },

  async bootstrapProfile(authUser) {
    const client = requireSupabase();
    const metadata = authUser.user_metadata || {};
    const { error } = await client.rpc('bootstrap_profile', {
      profile_name: metadata.full_name || metadata.name || null,
      profile_avatar_url: metadata.avatar_url || metadata.picture || null,
    });
    if (error) throw error;
  },

  async signInWithGoogle() {
    const client = requireSupabase();
    const redirectTo = Platform.OS === 'web' && typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'nearbin://auth/callback';
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) return { success: false, error: error.message };
    return { success: true, redirecting: true };
  },

  async signOut() {
    if (supabase) await supabase.auth.signOut();
  },

  async updateProfile({ name, phone, ward }) {
    const client = requireSupabase();
    const { error } = await client.rpc('update_my_profile', {
      profile_name: name || '',
      profile_phone: phone || '',
      profile_ward: ward || '',
    });
    if (error) throw error;
    return this.getCurrentUser();
  },

  toNearBinUser,
};
