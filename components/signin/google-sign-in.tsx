"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { WALKTHROUGH_DISCIPLINES_STEP } from "@/data/walkthrough";
import { isLineupComplete } from "@/lib/disciplines/selection";
import { citiesForState, INDIA_STATES } from "@/lib/signin/india-locations";
import {
  isSignupFormReady,
  type SignupClassLevel,
} from "@/lib/signin/signup-profile";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

const AUTH_NEXT_COOKIE = "edudeca_auth_next";

interface GoogleSignInFormProps {
  title: string;
  description: string;
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

const toggleBase =
  "flex-1 rounded-xl border-[1.5px] px-3 py-[15px] text-center text-[15px] font-bold transition-colors";
const toggleIdle =
  "border-[#232D33] bg-transparent text-[#8FA0A0] hover:border-[#5C6C6C]";
const toggleYes =
  "border-[#22D3A6] bg-[#12261F] text-white shadow-[inset_0_0_0_1px_rgba(34,211,166,0.25)]";
const toggleNo =
  "border-[#F0654F] bg-[#2A1416] text-white shadow-[inset_0_0_0_1px_rgba(240,101,79,0.25)]";
const fieldLabel = "mb-3 text-[13.5px] font-bold text-foreground";
const selectClass =
  "h-[54px] w-full appearance-none rounded-xl border-[1.5px] border-[#232D33] bg-[#151D23] bg-[length:12px] bg-[right_16px_center] bg-no-repeat px-[18px] text-[15px] text-foreground outline-none transition-colors focus:border-[#22D3A6] disabled:cursor-not-allowed disabled:opacity-50";
const selectArrow =
  "bg-[url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='%238FA0A0' viewBox='0 0 20 20'><path d='M5 7l5 5 5-5z'/></svg>\")]";

export function GoogleSignInForm({ title, description }: GoogleSignInFormProps) {
  const searchParams = useSearchParams();
  const disciplineLineup = useAppStore((s) => s.disciplineLineup);
  const setWalkthroughStep = useAppStore((s) => s.setWalkthroughStep);
  const signupClassLevel = useAppStore((s) => s.signupClassLevel);
  const setSignupClassLevel = useAppStore((s) => s.setSignupClassLevel);
  const signupCollege = useAppStore((s) => s.signupCollege);
  const setSignupCollege = useAppStore((s) => s.setSignupCollege);
  const signupScienceStream = useAppStore((s) => s.signupScienceStream);
  const setSignupScienceStream = useAppStore((s) => s.setSignupScienceStream);
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

  const cities = citiesForState(signupState);
  const formReady = isSignupFormReady({
    classLevel: signupClassLevel,
    college: signupCollege,
    scienceStream: signupScienceStream,
    institutionAck: signupInstitutionAck,
    state: signupState,
    city: signupCity,
  });
  const canStartGoogle = formReady && !signingIn;

  const selectClass = (level: SignupClassLevel) => {
    setSignupClassLevel(level);
    setError(null);
  };

  const onStateChange = (nextState: string) => {
    setSignupState(nextState);
    const nextCities = citiesForState(nextState);
    if (!nextCities.includes(signupCity)) setSignupCity("");
    setError(null);
  };

  const handleGoogleSignIn = async () => {
    if (!isLineupComplete(disciplineLineup)) {
      setError("Choose all 10 Decathlon disciplines first, then continue with Google.");
      setWalkthroughStep(WALKTHROUGH_DISCIPLINES_STEP);
      return;
    }

    if (
      !isSignupFormReady({
        classLevel: signupClassLevel,
        college: signupCollege,
        scienceStream: signupScienceStream,
        institutionAck: signupInstitutionAck,
        state: signupState,
        city: signupCity,
      })
    ) {
      setError("Complete class, science stream, institution, and location before continuing with Google.");
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
    <div className="mx-auto w-full max-w-[600px] text-left">
      <div className="mb-3.5 flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#22D3A6]/45 bg-[#22D3A6]/10 px-4 py-1.5 text-[11.5px] font-extrabold tracking-wide text-[#22D3A6]">
          🏁 FINAL STEP · SIGN IN
        </span>
      </div>

      <div className="mb-6 flex items-center justify-center gap-2 text-center text-[12.5px] font-bold text-[#F2B441]">
        <span className="inline-flex size-[22px] shrink-0 items-center justify-center rounded-full border border-[#F2B441]/40 bg-[#F2B441]/15 text-xs">
          🏆
        </span>
        <span>
          Continue your journey to become a chosen{" "}
          <span className="text-white">Whiz360</span>
        </span>
      </div>

      <h2 className="mb-2.5 text-center text-[26px] font-extrabold tracking-tight md:text-[32px]">
        {title}
      </h2>
      <p className="mb-8 text-center text-[14.5px] leading-relaxed text-[#8FA0A0]">
        {description}
      </p>

      <div className="mb-6">
        <p className={fieldLabel}>Which class are you in?</p>
        <div className="flex gap-3">
          {([11, 12] as const).map((level) => {
            const selected = signupClassLevel === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => selectClass(level)}
                className={cn(toggleBase, selected ? toggleYes : toggleIdle)}
                aria-pressed={selected}
              >
                Class {level}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <p className={fieldLabel}>Are you in the Science Stream?</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setSignupScienceStream(true);
              setError(null);
            }}
            className={cn(toggleBase, signupScienceStream ? toggleYes : toggleIdle)}
            aria-pressed={signupScienceStream}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => {
              setSignupScienceStream(false);
              setError(null);
            }}
            className={cn(
              toggleBase,
              !signupScienceStream ? toggleNo : toggleIdle,
            )}
            aria-pressed={!signupScienceStream}
          >
            No
          </button>
        </div>
        {!signupScienceStream ? (
          <p className="mt-3 flex items-start gap-2.5 rounded-[10px] border border-[#F0654F]/40 bg-[#F0654F]/10 px-3.5 py-3 text-[13px] font-semibold text-[#FFAFA0]">
            ⚠️ Only for Science Stream students — EduDeca&apos;s 10 disciplines are currently built around the Science stream.
          </p>
        ) : null}
      </div>

      <div className="mb-6">
        <label htmlFor="signup-college" className={fieldLabel}>
          My College / School / Institution Name
        </label>
        <input
          id="signup-college"
          type="text"
          autoComplete="organization"
          placeholder="e.g. Viswa Vignan"
          value={signupCollege}
          onChange={(e) => {
            setSignupCollege(e.target.value);
            setError(null);
          }}
          className="h-[54px] w-full rounded-xl border-[1.5px] border-[#232D33] bg-[#151D23] px-[18px] text-[15px] text-foreground outline-none transition-colors placeholder:text-[#5C6C6C] focus:border-[#22D3A6]"
        />
        <label
          className={cn(
            "mt-3 flex cursor-pointer items-start gap-2.5 rounded-[10px] border-[1.5px] px-3.5 py-3 transition-colors",
            signupInstitutionAck
              ? "border-[#22D3A6] bg-[#22D3A6]/[0.07]"
              : "border-[#232D33] bg-[#151D23] hover:border-[#5C6C6C]",
          )}
        >
          <input
            type="checkbox"
            className="mt-0.5 size-[17px] shrink-0 accent-[#22D3A6]"
            checked={signupInstitutionAck}
            onChange={(e) => {
              setSignupInstitutionAck(e.target.checked);
              setError(null);
            }}
          />
          <span className="text-[12.5px] leading-relaxed text-[#8FA0A0]">
            I understand that I need approval and support from my Educational Institution from{" "}
            <b className="text-foreground">Level-4</b> onwards.
          </span>
        </label>
      </div>

      <div className="mb-8">
        <p className={fieldLabel}>Your Location (within India)</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            aria-label="Select State"
            value={signupState}
            onChange={(e) => onStateChange(e.target.value)}
            className={cn(selectClass, selectArrow)}
          >
            <option value="">Select State</option>
            {INDIA_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          <select
            aria-label="Select City"
            value={signupCity}
            disabled={!signupState}
            onChange={(e) => {
              setSignupCity(e.target.value);
              setError(null);
            }}
            className={cn(selectClass, selectArrow)}
          >
            <option value="">Select City</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        className="flex h-[54px] w-full items-center justify-center gap-3 rounded-[14px] bg-white text-base font-bold text-[#1F2430] transition-[filter] hover:brightness-[0.97] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:brightness-100"
        onClick={() => void handleGoogleSignIn()}
        disabled={!canStartGoogle}
      >
        <GoogleMark className="size-5 shrink-0" />
        {signingIn ? "Connecting to Google…" : "Continue with Google"}
      </button>

      {error ? (
        <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <p className="mt-[18px] text-center text-xs leading-relaxed text-[#5C6C6C]">
        We use Google only to create your EduDeca account — no passwords to remember.
      </p>
    </div>
  );
}
