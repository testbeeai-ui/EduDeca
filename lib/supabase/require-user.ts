import type { SupabaseClient, User } from "@supabase/supabase-js";

import { createSupabaseServer } from "@/lib/supabase/server";

export async function requireApiUser(): Promise<{
  supabase: SupabaseClient;
  user: User;
} | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { supabase, user: data.user };
}
