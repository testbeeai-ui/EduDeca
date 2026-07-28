import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const AUTH_NEXT_COOKIE = "edudeca_auth_next";

/**
 * Exchange Google OAuth PKCE code and set session cookies.
 * Register these exact URLs in Supabase → Authentication → Redirect URLs:
 *   http://localhost:3001/auth/callback
 *   https://<edudeca-domain>/auth/callback
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  const nextCookieRaw = request.cookies.get(AUTH_NEXT_COOKIE)?.value;
  const nextParam = url.searchParams.get("next");
  let rawNext = nextParam || "/home";
  if (nextCookieRaw) {
    try {
      rawNext = decodeURIComponent(nextCookieRaw);
    } catch {
      rawNext = nextCookieRaw;
    }
  }
  const safeNext = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/home";
  const finish = new URL(safeNext, url.origin);
  finish.search = "";
  finish.hash = "";

  if (!code || code.length < 16) {
    const response = NextResponse.redirect(finish);
    response.cookies.set(AUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  }

  let response = NextResponse.redirect(finish);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.redirect(finish);
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              path: options?.path ?? "/",
              sameSite: options?.sameSite ?? "lax",
            }),
          );
        },
      },
    },
  );

  const cookieNames = request.cookies.getAll().map((c) => c.name);
  const hasVerifier = cookieNames.some(
    (n) => n.includes("code-verifier") || n.includes("code_verifier"),
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed", {
      message: error.message,
      status: error.status,
      hasVerifier,
      cookieNames: cookieNames.filter((n) => n.startsWith("sb-")),
    });
    const fail = new URL("/signin", url.origin);
    fail.searchParams.set("auth_error", "oauth_exchange_failed");
    response = NextResponse.redirect(fail);
  }

  response.cookies.set(AUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
