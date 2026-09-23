import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function getActiveRevisionSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("revision_sessions")
    .select("id, subject_id, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch active revision session:", error);
    return null;
  }

  return data;
}
