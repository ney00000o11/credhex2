import { createClient } from '@supabase/supabase-js';

// For development, you can use placeholder values or set up your actual Supabase project
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

// Only create the client if both URL and key are properly configured
let supabase = null;

if (supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'https://your-project.supabase.co' && 
    supabaseAnonKey !== 'your-anon-key') {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    supabase = null;
  }
} else {
  console.warn('Supabase configuration missing. Please set up your environment variables.');
}

export { supabase };