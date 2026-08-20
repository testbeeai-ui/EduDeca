import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

import { getCollegeApplicationForUser } from "@/lib/college/registry-store";
import {
  AUTH_NEXT_COOKIE,
  isEduDecaStudentEstablished,
  LOGIN_MODE_COOKIE,
  LOGIN_MODE_RETURNING,
} from "@/lib/signin/returning-login";

/**
 * Exchange Google OAuth PKCE code and set session cookies.
 * Register these exact URLs in Supabase → Authentication → Redirect URLs:
 *   http://localhost:3001/auth/callback
 *   https://<edudeca-domain>/auth/callback
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const loginMode = request.cookies.get(LOGIN_MODE_COOKIE)?.value ?? "";

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
  let safeNext = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/home";

  const clearAuthCookies = (response: NextResponse) => {
    response.cookies.set(AUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0 });
    response.cookies.set(LOGIN_MODE_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  };

  if (!code || code.length < 16) {
    const finishEarly = new URL(safeNext, url.origin);
    finishEarly.search = "";
    finishEarly.hash = "";
    return clearAuthCookies(NextResponse.redirect(finishEarly));
  }

  let finish = new URL(safeNext, url.origin);
  finish.search = "";
  finish.hash = "";
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

  const { data: exchanged, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed", {
      message: error.message,
      status: error.status,
      hasVerifier,
      cookieNames: cookieNames.filter((n) => n.startsWith("sb-")),
    });
    const failPath = safeNext.startsWith("/college/") ? "/college/signin" : "/signin";
    const fail = new URL(failPath, url.origin);
    fail.searchParams.set("auth_error", "oauth_exchange_failed");
    response = NextResponse.redirect(fail);
    return clearAuthCookies(response);
  }

  const userId = exchanged.session?.user?.id;
  if (userId) {
    try {
      const app = await getCollegeApplicationForUser(userId);
      if (app?.status === "approved") {
        safeNext = "/college/portal";
      } else if (app?.status === "pending" || app?.status === "rejected") {
        safeNext = "/college/pending";
      } else if (loginMode === LOGIN_MODE_RETURNING && !safeNext.startsWith("/college/")) {
        const { data: profile } = await supabase
          .from("edudeca_profiles")
          .select("class_level, institution_name")
          .eq("id", userId)
          .maybeSingle();
        const { data: progress } = await supabase
          .from("edudeca_user_progress")
          .select("campaign_level, xp, disciplines")
          .eq("user_id", userId)
          .maybeSingle();

        const established = isEduDecaStudentEstablished({
          classLevel:
            profile && typeof profile.class_level === "number" ? profile.class_level : null,
          institutionName:
            profile && typeof profile.institution_name === "string"
              ? profile.institution_name
              : null,
          disciplines: Array.isArray(progress?.disciplines)
            ? (progress?.disciplines as string[])
            : null,
          xp: progress && typeof progress.xp === "number" ? progress.xp : 0,
          campaignLevel:
            progress && typeof progress.campaign_level === "number"
              ? progress.campaign_level
              : 1,
        });

        if (!established) {
          safeNext = "/signin";
          finish = new URL(safeNext, url.origin);
          finish.searchParams.set("auth_notice", "new_account");
          finish.hash = "";
          response = NextResponse.redirect(finish);
          return clearAuthCookies(response);
        }
      }

      if (safeNext !== finish.pathname || finish.search) {
        finish = new URL(safeNext, url.origin);
        finish.search = "";
        finish.hash = "";
        response = NextResponse.redirect(finish);
      }
    } catch {
      /* registry / profile read is best-effort */
    }
  }

  return clearAuthCookies(response);
}
