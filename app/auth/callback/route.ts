import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

import { getCollegeApplicationForUser } from "@/lib/college/registry-store";
import {
  AUTH_NEXT_COOKIE,
  isEduDecaStudentEstablished,
  LOGIN_MODE_COOKIE,
} from "@/lib/signin/returning-login";

type PendingCookie = { name: string; value: string; options?: CookieOptions };

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
  let safeNext = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/home";

  let pendingCookies: PendingCookie[] = [];

  const applySessionCookies = (response: NextResponse) => {
    for (const { name, value, options } of pendingCookies) {
      response.cookies.set(name, value, {
        ...options,
        path: options?.path ?? "/",
        sameSite: options?.sameSite ?? "lax",
      });
    }
    return response;
  };

  const clearAuthCookies = (response: NextResponse) => {
    response.cookies.set(AUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0 });
    response.cookies.set(LOGIN_MODE_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  };

  const redirectWithSession = (target: URL) => {
    const response = NextResponse.redirect(target);
    applySessionCookies(response);
    return clearAuthCookies(response);
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
          pendingCookies = cookiesToSet;
          response = NextResponse.redirect(finish);
          applySessionCookies(response);
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
    return clearAuthCookies(applySessionCookies(NextResponse.redirect(fail)));
  }

  const userId = exchanged.session?.user?.id;
  if (userId) {
    try {
      // Case A: college invite email → Google sign-in marks invitation joined.
      const { error: inviteSyncErr } = await supabase.rpc(
        "edudeca_sync_invite_conversion",
      );
      if (inviteSyncErr) {
        console.warn(
          "[auth/callback] invite conversion sync skipped",
          inviteSyncErr.message,
        );
      }

      // Use the exchange client (session cookies just set) — not a fresh createSupabaseServer().
      const app = await getCollegeApplicationForUser(userId, supabase);
      if (app?.status === "approved") {
        safeNext = "/college/portal";
      } else if (app?.status === "pending" || app?.status === "rejected") {
        safeNext = "/college/pending";
      } else if (!safeNext.startsWith("/college/")) {
        // Any Google sign-in into the student app: brand-new Auth users with no
        // EduDeca profile/progress must finish the walkthrough details first.
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
          finish = new URL("/signin", url.origin);
          finish.searchParams.set("auth_notice", "new_account");
          finish.hash = "";
          return redirectWithSession(finish);
        }
      }

      if (safeNext !== finish.pathname || finish.search) {
        finish = new URL(safeNext, url.origin);
        finish.search = "";
        finish.hash = "";
        return redirectWithSession(finish);
      }
    } catch {
      /* registry / profile read is best-effort */
    }
  }

  return clearAuthCookies(response);
}
