import { NextResponse, type NextRequest } from "next/server";

import { hasLiveAccessToken, hasRefreshableSession } from "@/lib/supabase/auth-cookie";
import { createSupabaseMiddleware } from "@/lib/supabase/middleware";
import {
  SESSION_REFRESH_TIMEOUT_MS,
  isStaleAuthRefreshError,
  withTimeout,
} from "@/lib/supabase/session-refresh";

function clearAuthCookies(response: NextResponse, request: NextRequest) {
  for (const cookie of request.cookies.getAll()) {
    if (!cookie.name.startsWith("sb-")) continue;
    response.cookies.set(cookie.name, "", { path: "/", maxAge: 0 });
  }
  return response;
}

export async function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    const host = request.headers.get("host") ?? "";
    if (host.startsWith("127.0.0.1")) {
      const url = request.nextUrl.clone();
      url.hostname = "localhost";
      return NextResponse.redirect(url, 307);
    }
  }

  const pathname = request.nextUrl.pathname;

  const oauthCode = request.nextUrl.searchParams.get("code");
  if (
    oauthCode &&
    oauthCode.length >= 16 &&
    (pathname === "/" || pathname === "" || pathname === "/home")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url, 307);
  }

  if (pathname === "/auth/callback") {
    return NextResponse.next();
  }

  const cookies = request.cookies.getAll();
  const hasAuthCookies = cookies.some((c) => c.name.startsWith("sb-"));
  if (!hasAuthCookies) {
    return NextResponse.next();
  }

  if (hasLiveAccessToken(cookies)) {
    return NextResponse.next();
  }

  if (!hasRefreshableSession(cookies)) {
    return clearAuthCookies(NextResponse.next({ request }), request);
  }

  const { supabase, getResponse } = createSupabaseMiddleware(request);
  try {
    const { error } = await withTimeout(
      Promise.resolve(supabase.auth.getUser()),
      SESSION_REFRESH_TIMEOUT_MS,
    );
    if (error && isStaleAuthRefreshError(error.code ?? "", error.message)) {
      return clearAuthCookies(getResponse(), request);
    }
  } catch {
    // Keep the refresh cookie; the browser client can retry after boot.
  }
  return getResponse();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
