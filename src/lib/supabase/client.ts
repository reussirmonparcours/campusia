import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for browser contexts.
 * Uses only public environment variables.
 * Enforces Row Level Security (RLS) policies defined in Supabase.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "[MonParcours Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Please verify your .env.local configuration."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
