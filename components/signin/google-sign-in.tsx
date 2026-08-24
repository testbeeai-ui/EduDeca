"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { LocationSelect } from "@/components/signin/location-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WALKTHROUGH_DISCIPLINES_STEP } from "@/data/walkthrough";
import { isLineupComplete, lineupIds } from "@/lib/disciplines/selection";
import { patchDisciplines } from "@/lib/progress/client";
import { getCitiesForState, INDIAN_STATES_AND_UTS } from "@/lib/signin/india-geo";
import { AUTH_NEXT_COOKIE } from "@/lib/signin/returning-login";
import {
  isSignupProfileReady,
  type SignupClassLevel,
} from "@/lib/signin/signup-profile";
import { syncSignupProfileFromLocal } from "@/lib/signin/sync-signup-profile";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

interface GoogleSignInFormProps {
  title: string;
  description: string;
}

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

export function GoogleSignInForm({ title, description }: GoogleSignInFormProps) {
  const searchParams = useSearchParams();
  const disciplineLineup = useAppStore((s) => s.disciplineLineup);
  const setWalkthroughStep = useAppStore((s) => s.setWalkthroughStep);
  const signupClassLevel = useAppStore((s) => s.signupClassLevel);
  const setSignupClassLevel = useAppStore((s) => s.setSignupClassLevel);
  const signupCollege = useAppStore((s) => s.signupCollege);
  const setSignupCollege = useAppStore((s) => s.setSignupCollege);
  const signupInstitutionAck = useAppStore((s) => s.signupInstitutionAck);
  const setSignupInstitutionAck = useAppStore((s) => s.setSignupInstitutionAck);
  const signupState = useAppStore((s) => s.signupState);
  const setSignupState = useAppStore((s) => s.setSignupState);
  const signupCity = useAppStore((s) => s.signupCity);
  const setSignupCity = useAppStore((s) => s.setSignupCity);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    const authError = searchParams.get("auth_error");
    if (authError === "oauth_exchange_failed") {
      return "Google sign-in did not finish. Add http://localhost:3001/auth/callback in Supabase → Authentication → Redirect URLs, then use http://localhost:3001 (not 127.0.0.1).";
    }
    return null;
  });
  const isSignedIn = useAppStore((s) => s.isSignedIn);

  const cities = getCitiesForState(signupState);
  const profileReady = isSignupProfileReady({
    classLevel: signupClassLevel,
    college: signupCollege,
    institutionAck: signupInstitutionAck,
    state: signupState,
    city: signupCity,
  });
  const canStartGoogle = profileReady && !signingIn;

  const selectClass = (level: SignupClassLevel) => {
    setSignupClassLevel(level);
    setError(null);
  };

  const handleGoogleSignIn = async () => {
    if (!isLineupComplete(disciplineLineup)) {
      setError("Choose all 10 Decathlon disciplines first, then continue with Google.");
      setWalkthroughStep(WALKTHROUGH_DISCIPLINES_STEP);
      return;
    }

    if (
      !isSignupProfileReady({
        classLevel: signupClassLevel,
        college: signupCollege,
        institutionAck: signupInstitutionAck,
        state: signupState,
        city: signupCity,
      })
    ) {
      setError(
        "Choose class, college, tick the Level-4 note, and pick state and city before continuing with Google.",
      );
      return;
    }

    setSigningIn(true);
    setError(null);

    try {
      const origin = window.location.origin;
      if (origin.includes("127.0.0.1") || /^https?:\/\/\d+\.\d+\.\d+\.\d+/.test(origin)) {
        setError("Open EduDeca at http://localhost:3001 before signing in.");
        setSigningIn(false);
        return;
      }

      // Persist walkthrough answers before OAuth so AuthGate does not see an
      // empty server profile and bounce the user back to /signin forever.
      await syncSignupProfileFromLocal();
      const ids = lineupIds(disciplineLineup);
      const synced = await patchDisciplines(ids);
      if (synced) useAppStore.getState().hydrateProgress(synced);

      // Already signed in (e.g. returned from “Log in with Google” as a new account)
      // — save walkthrough answers and go home without another OAuth round-trip.
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        window.location.href = "/home";
        return;
      }

      // Always land on the homepage after signup/sign-in — start the
      // challenge from Home via "Start Today's Challenge", not OAuth return.
      document.cookie = `${AUTH_NEXT_COOKIE}=${encodeURIComponent("/home")}; path=/; max-age=600; SameSite=Lax`;

      const redirectTo = `${origin}/auth/callback`;
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account" },
        },
      });

      if (oauthError) {
        console.error("signInWithOAuth error:", oauthError);
        setError(oauthError.message || "Could not start Google sign-in. Please try again.");
        setSigningIn(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setError("Could not start Google sign-in. Please try again.");
      setSigningIn(false);
    } catch (err) {
      console.error("signInWithOAuth error:", err);
      setError("Could not start Google sign-in. Please try again.");
      setSigningIn(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-4 text-left">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Which class are you in?</p>
          <div className="grid grid-cols-2 gap-2">
            {([11, 12] as const).map((level) => {
              const selected = signupClassLevel === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => selectClass(level)}
                  className={cn(
                    "h-12 rounded-2xl border text-sm font-semibold transition-colors",
                    selected
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40",
                  )}
                  aria-pressed={selected}
                >
                  Class {level}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-college" className="text-sm font-medium text-foreground">
            Which college are you from?
          </label>
          <Input
            id="signup-college"
            type="text"
            autoComplete="organization"
            placeholder="Your school or college name"
            value={signupCollege}
            onChange={(e) => {
              setSignupCollege(e.target.value);
              setError(null);
            }}
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3">
          <input
            type="checkbox"
            checked={signupInstitutionAck}
            onChange={(e) => {
              setSignupInstitutionAck(e.target.checked);
              setError(null);
            }}
            className="mt-0.5 size-4 shrink-0 rounded border-border accent-primary"
          />
          <span className="text-sm leading-snug text-muted-foreground">
            I understand that I need approval and support from my Educational Institution from{" "}
            <span className="font-bold text-foreground">Level-4</span> onwards.
          </span>
        </label>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Your Location (within India)</p>
          <div className="grid grid-cols-2 gap-2">
            <LocationSelect
              label="State"
              placeholder="State"
              value={signupState}
              options={INDIAN_STATES_AND_UTS}
              onChange={(state) => {
                setSignupState(state);
                setError(null);
              }}
            />
            <LocationSelect
              label="City"
              placeholder="City"
              value={signupCity}
              options={cities}
              disabled={!signupState}
              onChange={(city) => {
                setSignupCity(city);
                setError(null);
              }}
            />
          </div>
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        className="h-14 w-full gap-3 rounded-2xl bg-white text-base font-semibold text-zinc-900 hover:bg-white/90 disabled:opacity-50"
        onClick={() => void handleGoogleSignIn()}
        disabled={!canStartGoogle}
      >
        <GoogleMark className="size-5 shrink-0" />
        {signingIn
          ? isSignedIn
            ? "Saving your profile…"
            : "Connecting to Google…"
          : isSignedIn
            ? "Save profile & continue"
            : "Continue with Google"}
      </Button>

      {!profileReady && !signingIn ? (
        <p className="text-center text-xs text-muted-foreground">
          Tick the Level-4 note and select state and city to continue.
        </p>
      ) : null}

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
          {error}
        </p>
      )}

      <p className="text-center text-xs text-muted-foreground">
        We use Google only to create your EduDeca account — no passwords to remember.
      </p>

      <p className="text-center text-xs text-muted-foreground">
        Registering your institution?{" "}
        <Link href="/college/signin" className="font-medium text-primary underline-offset-2 hover:underline">
          College / institution registration
        </Link>
        . Use a different Google account than your student login.
      </p>
    </div>
  );
}
