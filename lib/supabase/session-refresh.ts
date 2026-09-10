export const SESSION_REFRESH_TIMEOUT_MS = 3_000;
export const SUPABASE_FETCH_TIMEOUT_MS = 8_000;

export function shouldSkipSessionRefresh(_pathname: string): boolean {
  return true;
}

export function isStaleAuthRefreshError(code: string, message: string): boolean {
  const combined = `${code} ${message}`.toLowerCase();
  return (
    combined.includes("refresh_token_not_found") ||
    combined.includes("invalid refresh token") ||
    combined.includes("session refresh timeout") ||
    combined.includes("aborted due to timeout")
  );
}

export function timedSupabaseFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, {
    ...init,
    signal: AbortSignal.timeout(SUPABASE_FETCH_TIMEOUT_MS),
  });
}

export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("session refresh timeout")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
