import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { timedSupabaseFetch } from "@/lib/supabase/session-refresh";

/**
 * Cookie-less client so public reads cannot trigger a user token refresh.
 * Uses the same anon key as the rest of the app — not service_role.
 */
export function createSupabaseNoSession(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: timedSupabaseFetch,
    },
  });
}
