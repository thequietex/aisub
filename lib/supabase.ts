import { createClient } from '@supabase/supabase-js';

// Supabase client for server-side operations (with service role key)
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Supabase client for client-side operations (with anon key)
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// Type definitions for the database
export interface Bounty {
  id: string;
  created_at: string;
  status: 'open' | 'claimed';
  riddle: string;
  reward_text: string;
  answer_hash: string;
  winner_wallet: string | null;
  txn_signature: string | null;
}

export interface BountyAttempt {
  id: string;
  created_at: string;
  bounty_id: string;
  wallet_address: string;
  captcha_token: string | null;
  ip_address: string | null;
  user_agent: string | null;
}
