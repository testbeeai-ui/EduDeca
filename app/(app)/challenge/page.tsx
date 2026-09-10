"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { ChallengeBlocked } from "@/components/challenge/challenge-blocked";
import { ChallengeSession } from "@/components/challenge/challenge-session";
import { Level4Gate } from "@/components/challenge/level4-gate";
import { EduDecaLogo } from "@/components/shell/edudeca-logo";
import { useLevelTrials } from "@/hooks/use-level-trials";
import { useQuestionAvailability } from "@/hooks/use-question-availability";
import { isTesterInvestorEmail } from "@/lib/admin/tester-allowlist";
import { isLevelReady } from "@/lib/challenge/availability";
import { isLevel4Campaign } from "@/lib/challenge/level4-gate-copy";
import { saveChallengeAttempt } from "@/lib/challenge/load-daily-challenge";
import {
  challengeGroupsPerDiscipline,
  challengeMaxStrikes,
  challengeQuestionCount,
  challengeSessionDurationSec,
} from "@/lib/challenge/spec";
import { trialGateMessage } from "@/lib/challenge/trials";
import type { ChallengeCompletePayload } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";

export default function ChallengePage() {
  const router = useRouter();
  const email = useAppStore((s) => s.email);
  const campaignLevel = useAppStore((s) => s.campaignLevel);
  const todayCompleted = useAppStore((s) => s.todayCompleted);
  const applyChallengeResult = useAppStore((s) => s.applyChallengeResult);
  const hydrateProgress = useAppStore((s) => s.hydrateProgress);
  const antiCapturePreference = useAppStore((s) => s.antiCaptureEnabled);

  // Freeze the level for this visit so winning L1 cannot auto-boot L2 on this page.
  const [runLevel] = useState(campaignLevel);
  const [adminPreview, setAdminPreview] = useState(false);

  const isAdmin = isTesterInvestorEmail(email);
  const availability = useQuestionAvailability();
  const level4BankReady = isLevelReady(availability, 4);
  const { trials, loading: trialsLoading } = useLevelTrials(true);
  const antiCaptureEnabled =
    runLevel >= 4 && (isAdmin ? antiCapturePreference : true);
  const showLevel4Gate = isLevel4Campaign(runLevel) && !(isAdmin && adminPreview);
  const completedToday = todayCompleted && !showLevel4Gate && !isAdmin;
  const maxStrikes = challengeMaxStrikes(runLevel);
  const questionCount = challengeQuestionCount(runLevel);
  const groupsPerDiscipline = challengeGroupsPerDiscipline(runLevel);
  const sessionMinutes = challengeSessionDurationSec(runLevel) / 60;
  const studentGate = !isAdmin && trials && trials.gate !== "ok" ? trials.gate : null;

  const handleComplete = useCallback(
    async (payload: ChallengeCompletePayload) => {
      const strikes = payload.results.filter((r) => !r.isCorrect).length;
      if (payload.reason === "quit") {
        return saveChallengeAttempt({ ...payload, strikes });
      }
      applyChallengeResult(payload);
      const result = await saveChallengeAttempt({ ...payload, strikes });
      if (result.progress) hydrateProgress(result.progress);
      return result;
    },
    [applyChallengeResult, hydrateProgress],
  );

  if (showLevel4Gate) {
    return (
      <div className="relative flex h-dvh flex-col overflow-hidden bg-slate-950">
        <header className="relative z-20 flex h-14 shrink-0 items-center px-5 sm:px-8">
          <EduDecaLogo />
        </header>
        <Level4Gate
          onBack={() => router.push("/home")}
          isAdmin={isAdmin}
          bankReady={level4BankReady}
          onAdminPreview={() => setAdminPreview(true)}
        />
      </div>
    );
  }

  if (completedToday) {
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

  if (!isAdmin && trialsLoading) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 text-muted-foreground">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm">Checking attempts…</p>
      </div>
    );
  }

  if (studentGate && studentGate !== "daily_lock") {
    const copy = trialGateMessage(studentGate);
    return (
      <div className="flex h-dvh flex-col items-center justify-center px-4">
        <ChallengeBlocked
          title={copy.code === "TRIALS_EXHAUSTED" ? "No attempts left" : "Not available"}
          description={copy.error}
          onBack={() => router.push("/home")}
        />
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
              {questionCount} questions · {groupsPerDiscipline} per discipline ·{" "}
              {sessionMinutes} minutes · {maxStrikes} strikes
              {isAdmin ? " · unlimited tester attempts" : " · 10 fail attempts"}
              {antiCaptureEnabled ? " · Screenshots blocked" : ""} · finish to pass
            </p>
          </div>
        </header>

        <ChallengeSession
          campaignLevel={runLevel}
          remainingAttempts={isAdmin ? null : (trials?.remaining ?? null)}
          failCount={trials?.failCount ?? 0}
          unlimitedTrials={isAdmin}
          onComplete={handleComplete}
          onQuit={() => router.push("/home")}
        />
      </div>
    </div>
  );
}
