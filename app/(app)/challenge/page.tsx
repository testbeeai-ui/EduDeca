"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { ChallengeSession } from "@/components/challenge/challenge-session";
import { ProctoredPaywall } from "@/components/challenge/proctored-paywall";
import { EduDecaLogo } from "@/components/shell/edudeca-logo";
import { isTesterInvestorEmail } from "@/lib/admin/tester-allowlist";
import { saveChallengeAttempt } from "@/lib/challenge/load-daily-challenge";
import { challengeMaxStrikes } from "@/lib/challenge/spec";
import type { ChallengeCompletePayload } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";

export default function ChallengePage() {
  const router = useRouter();
  const email = useAppStore((s) => s.email);
  const campaignLevel = useAppStore((s) => s.campaignLevel);
  const isProctoredPaid = useAppStore((s) => s.isProctoredPaid);
  const todayCompleted = useAppStore((s) => s.todayCompleted);
  const applyChallengeResult = useAppStore((s) => s.applyChallengeResult);
  const setProctoredPaid = useAppStore((s) => s.setProctoredPaid);
  const hydrateProgress = useAppStore((s) => s.hydrateProgress);
  const antiCapturePreference = useAppStore((s) => s.antiCaptureEnabled);

  // Freeze the level for this visit so winning L1 cannot auto-boot L2 on this page.
  const [runLevel] = useState(campaignLevel);
  const [paywallOpen, setPaywallOpen] = useState(
    () => campaignLevel >= 4 && !isProctoredPaid
  );
  const [started, setStarted] = useState(false);

  const isTester = isTesterInvestorEmail(email);
  const antiCaptureEnabled =
    runLevel >= 4 && (isTester ? antiCapturePreference : true);
  const blocked = campaignLevel >= 4 && !isProctoredPaid;
  const completedToday = todayCompleted && !blocked && !isTester;
  const maxStrikes = challengeMaxStrikes(runLevel);


  const handleComplete = useCallback(
    (payload: ChallengeCompletePayload) => {
      if (payload.reason !== "quit") {
        applyChallengeResult(payload);
        const strikes = payload.results.filter((r) => !r.isCorrect).length;
        void saveChallengeAttempt({ ...payload, strikes }).then((progress) => {
          if (progress) hydrateProgress(progress);
        });
      }
      if (payload.reason === "won" && payload.campaignLevelAtStart === 3) {
        setPaywallOpen(true);
      }
    },
    [applyChallengeResult, hydrateProgress]
  );

  const handlePay = () => {
    setProctoredPaid();
    setPaywallOpen(false);
    setStarted(true);
  };

  if (blocked && !started) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden px-4 py-6 sm:px-8">
        <header className="flex h-12 shrink-0 items-center">
          <EduDecaLogo />
        </header>
        <ProctoredPaywall open={paywallOpen} onOpenChange={setPaywallOpen} onPay={handlePay} />
        {!paywallOpen ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <p className="text-lg font-semibold text-foreground">Proctored round required</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Complete payment to unlock Level 4 and continue your campaign.
            </p>
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => setPaywallOpen(true)}
            >
              View unlock options
            </button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:underline"
              onClick={() => router.push("/home")}
            >
              Back to Home
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (completedToday && !started) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-xl font-semibold text-foreground">Today&apos;s challenge complete</p>
        <p className="max-w-md text-sm text-muted-foreground">
          You passed today&apos;s round. Come back tomorrow for the next challenge.
        </p>
        <button
          type="button"
          className="text-sm text-primary hover:underline"
          onClick={() => router.push("/home")}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-20%,rgba(29,158,117,0.14),transparent)]"
        aria-hidden
      />

      <div className="relative flex min-h-0 flex-1 flex-col px-3 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-4">
        <header className="mb-2 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 sm:mb-3">
          <EduDecaLogo />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary sm:text-xs">
              Daily Challenge
            </p>
            <p className="text-[11px] text-muted-foreground sm:text-xs">
              10 questions · 1 per discipline · {maxStrikes} strikes
              {antiCaptureEnabled ? " · Screenshots blocked" : ""} · finish to pass
            </p>
          </div>
        </header>

        <ChallengeSession
          campaignLevel={runLevel}
          onComplete={handleComplete}
          onQuit={() => router.push("/home")}
          onOpenPaywall={() => setPaywallOpen(true)}
        />
      </div>

      <ProctoredPaywall open={paywallOpen} onOpenChange={setPaywallOpen} onPay={handlePay} />
    </div>
  );
}
