import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

import { AUTH_COOKIE_MAX_AGE_SEC, persistAuthCookieOptions } from "@/lib/supabase/auth-cookie";
import { timedSupabaseFetch } from "@/lib/supabase/session-refresh";

export async function createSupabaseServer(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      maxAge: AUTH_COOKIE_MAX_AGE_SEC,
    },
    global: {
      fetch: timedSupabaseFetch,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, persistAuthCookieOptions(options)),
          );
        } catch {
          // Called from a Server Component — middleware will refresh sessions.
        }
      },
    },
  });
}
