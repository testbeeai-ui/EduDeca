import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseMiddleware } from "@/lib/supabase/middleware";

function clearAuthCookies(response: NextResponse, request: NextRequest) {
  for (const cookie of request.cookies.getAll()) {
    if (!cookie.name.startsWith("sb-")) continue;
    response.cookies.set(cookie.name, "", { path: "/", maxAge: 0 });
  }
  return response;
}

export async function middleware(request: NextRequest) {
  // Keep one cookie host in dev (localhost vs 127.0.0.1 break Google OAuth cookies).
  if (process.env.NODE_ENV === "development") {
    const host = request.headers.get("host") ?? "";
    if (host.startsWith("127.0.0.1")) {
      const url = request.nextUrl.clone();
      url.hostname = "localhost";
      return NextResponse.redirect(url, 307);
    }
  }

  const pathname = request.nextUrl.pathname;

  // Google sometimes returns to Site URL with ?code= instead of /auth/callback.
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

  const hasAuthCookies = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  if (!hasAuthCookies) {
    return NextResponse.next();
  }

  try {
    const { supabase, getResponse } = createSupabaseMiddleware(request);
    await supabase.auth.getUser();
    return getResponse();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[middleware] session refresh skipped", message);
    if (
      message.includes("JSON") ||
      message.includes("Unexpected end") ||
      message.includes("parse")
    ) {
      return clearAuthCookies(NextResponse.next({ request }), request);
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
