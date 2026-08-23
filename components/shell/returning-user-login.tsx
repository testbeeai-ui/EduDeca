"use client";

import { useState } from "react";

import {
  AUTH_NEXT_COOKIE,
  LOGIN_MODE_COOKIE,
  LOGIN_MODE_RETURNING,
} from "@/lib/signin/returning-login";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function ReturningUserLogin({
  className,
  compact = false,
}: {
  className?: string;
  /** Tighter layout for the mobile bar above the tab nav. */
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startReturningGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      const origin = window.location.origin;
      if (origin.includes("127.0.0.1") || /^https?:\/\/\d+\.\d+\.\d+\.\d+/.test(origin)) {
        setError("Open EduDeca at http://localhost:3001");
        setBusy(false);
        return;
      }

      document.cookie = `${AUTH_NEXT_COOKIE}=${encodeURIComponent("/home")}; path=/; max-age=600; SameSite=Lax`;
      document.cookie = `${LOGIN_MODE_COOKIE}=${LOGIN_MODE_RETURNING}; path=/; max-age=600; SameSite=Lax`;

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: { prompt: "select_account" },
        },
      });

      if (oauthError) {
        setError(oauthError.message || "Could not start Google login.");
        setBusy(false);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setError("Could not start Google login.");
      setBusy(false);
    } catch {
      setError("Could not start Google login.");
      setBusy(false);
    }
  };

  return (
    <div className={cn("w-full min-w-0 overflow-visible", className)}>
      <p
        className={cn(
          "truncate font-medium text-muted-foreground",
          compact ? "mb-2 text-xs" : "mb-0 px-1 text-sm",
        )}
      >
        Already a user
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void startReturningGoogle()}
        className={cn(
          "flex w-full items-center justify-center gap-2.5 rounded-xl",
          "bg-white font-semibold text-zinc-900 shadow-sm transition hover:bg-white/90",
          "disabled:cursor-not-allowed disabled:opacity-60",
          compact ? "mt-0 h-10 text-sm" : "mt-4 h-11 text-sm",
        )}
      >
        <GoogleMark className="size-4 shrink-0" />
        <span className="truncate">{busy ? "Connecting…" : "Continue with Google"}</span>
      </button>
      {error ? (
        <p className="mt-2 text-center text-[11px] text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
