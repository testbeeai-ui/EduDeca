const AUTH_TOKEN_COOKIE = /^sb-.+-auth-token(?:\.\d+)?$/;

type CookiePair = { name: string; value: string };

type SessionBits = {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
};

function decodeBase64Url(value: string): string {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  return atob(b64 + pad);
}

function decodeCookiePayload(raw: string): string | null {
  if (!raw.startsWith("base64-")) return raw;
  try {
    return decodeBase64Url(raw.slice("base64-".length));
  } catch {
    return null;
  }
}

function jwtExpSeconds(token: string): number | null {
  const parts = token.split(".");
  if (parts.length < 2 || !parts[1]) return null;
  try {
    const json = decodeBase64Url(parts[1]);
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

export function parseSupabaseSessionCookie(cookies: CookiePair[]): SessionBits | null {
  const chunks = cookies
    .filter((c) => AUTH_TOKEN_COOKIE.test(c.name))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
  if (chunks.length === 0) return null;
  const joined = chunks.map((c) => c.value).join("");
  const decoded = decodeCookiePayload(joined);
  if (!decoded) return null;
  try {
    return JSON.parse(decoded) as SessionBits;
  } catch {
    return null;
  }
}

/** Chrome persists cookies up to ~400 days. Same default as @supabase/ssr. */
export const AUTH_COOKIE_MAX_AGE_SEC = 400 * 24 * 60 * 60;

type AuthCookieWriteOptions = {
  path?: string;
  maxAge?: number;
  sameSite?: boolean | "lax" | "strict" | "none";
  httpOnly?: boolean;
  secure?: boolean;
  domain?: string;
};

/** Force persistent cookies. maxAge 0 still means delete. */
export function persistAuthCookieOptions(
  options?: AuthCookieWriteOptions,
): AuthCookieWriteOptions & { path: string; maxAge: number } {
  if (options?.maxAge === 0) {
    return {
      ...options,
      path: options.path ?? "/",
      maxAge: 0,
    };
  }
  return {
    ...options,
    path: options?.path ?? "/",
    sameSite: options?.sameSite ?? "lax",
    maxAge: AUTH_COOKIE_MAX_AGE_SEC,
  };
}

/** True when a refresh token is stored, even if the access JWT already expired. */
export function hasRefreshableSession(cookies: CookiePair[]): boolean {
  const session = parseSupabaseSessionCookie(cookies);
  return Boolean(session?.refresh_token && session.refresh_token.length > 0);
}

/** True only when the access JWT is still in date. Expired cookies must not hit Auth. */
export function hasLiveAccessToken(
  cookies: CookiePair[],
  nowMs: number = Date.now(),
): boolean {
  const session = parseSupabaseSessionCookie(cookies);
  if (!session?.access_token) return false;
  if (typeof session.expires_at === "number" && session.expires_at * 1000 <= nowMs) {
    return false;
  }
  const jwtExp = jwtExpSeconds(session.access_token);
  if (jwtExp != null && jwtExp * 1000 <= nowMs) return false;
  return true;
}
