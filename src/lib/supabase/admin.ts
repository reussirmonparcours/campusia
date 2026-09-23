import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * ==============================================================================
 * CRITICAL SECURITY NOTICE — HIGH PRIVILEGE MODULE
 * ==============================================================================
 *
 * This module creates a Supabase client using the SUPABASE_SERVICE_ROLE_KEY.
 *
 * 1. BYPASSES ROW LEVEL SECURITY (RLS):
 *    This client completely circumvents all RLS policies configured in the
 *    database. Any query executed through this client will execute with full
 *    unrestricted database administrator permissions.
 *
 * 2. NO CLIENT COMPONENT IMPORT:
 *    The `import "server-only"` directive above ensures that this file can
 *    NEVER be imported directly or transitively into client-side bundles.
 *
 * 3. NO DEFAULT USAGE IN BUSINESS CODE:
 *    Standard user flows, queries, and student mutations MUST ALWAYS use the
 *    session-scoped server client (src/lib/supabase/server.ts) to enforce RLS.
 *
 * 4. MILESTONE 01 SCOPE:
 *    No student or user data is manipulated through this client in this milestone.
 *    This module exists solely to prepare backend infrastructure for legitimate
 *    administrative background tasks (e.g. secure webhooks, batch jobs).
 * ==============================================================================
 */

/**
 * Instantiates the Supabase admin client.
 * Strictly forbidden in client components and standard student flows.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "[MonParcours Security] Unable to instantiate Admin Client: Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
