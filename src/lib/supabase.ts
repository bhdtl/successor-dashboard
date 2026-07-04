import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if credentials are valid and not the default placeholders
const hasValidConfig = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_PROJECT_URL' && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

export const isOfflineMode = !hasValidConfig;

// Export actual Supabase client or a mock client if offline
export const supabase = !isOfflineMode
  ? createClient(supabaseUrl, supabaseAnonKey)
  : ({
      auth: {
        // Mock session state for testing Auth UI locally when offline
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: (callback: any) => {
          // Allow simulated auth callbacks in mock mode
          return { data: { subscription: { unsubscribe: () => {} } } };
        },
        signInWithPassword: async () => ({ data: { user: null }, error: new Error('Offline Mock Mode active') }),
        signOut: async () => ({ error: null })
      }
    } as any);

if (isOfflineMode) {
  console.warn(
    'Successor warning: Running in Local Offline Mode. Add your Supabase URL & Anon Key to .env to connect to your live database.'
  );
} else {
  console.log('Successor: Connected to live Supabase project!');
}
