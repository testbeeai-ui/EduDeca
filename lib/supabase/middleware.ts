import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE_MAX_AGE_SEC, persistAuthCookieOptions } from "@/lib/supabase/auth-cookie";
import { timedSupabaseFetch } from "@/lib/supabase/session-refresh";

/** Refresh Supabase auth cookies on the response. */
export function createSupabaseMiddleware(request: NextRequest): {
  supabase: ReturnType<typeof createServerClient>;
  getResponse: () => NextResponse;
} {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    throw new Error("Missing Supabase env for middleware");
  }

  const supabase = createServerClient(url, key, {
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
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, persistAuthCookieOptions(options)),
        );
      },
    },
  });

  return {
    supabase,
    getResponse: () => response,
  };
}
