import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables! Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Returns the public thumbnail URL for a Dokkan Battle card.
 * 
 * The source CDN (dokkandb.com) uses JP card IDs which always end in 0.
 * Our DB stores EN card IDs which end in 1. We derive the JP ID by
 * replacing the last digit with 0, matching the CDN folder structure:
 * character/thumb/card_{jpId}_thumb_folder/card_{jpId}_thumb.png
 */
const DOKKAN_CDN_BASE = 'https://enaskhebnjtktdfszdcb.supabase.co/storage/v1/object/public/assets';

export function getDokkanThumbUrl(enId: number | string): string {
  const jpId = String(enId).slice(0, -1) + '0';
  return `${DOKKAN_CDN_BASE}/character/thumb/card_${jpId}_thumb_folder/card_${jpId}_thumb.png`;
}

