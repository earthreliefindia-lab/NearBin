import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl?.startsWith('https://') && supabaseAnonKey?.length > 40
);

// The anon key identifies the public client; Row Level Security protects data.
// Secret/service-role keys must only live in Supabase Edge Function secrets.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    })
  : null;

export const requireSupabase = () => {
  if (!supabase) {
    throw new Error('NearBin cloud account is not configured yet. Please try again after the next app update.');
  }
  return supabase;
};
