"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CameraOff } from "lucide-react";

import { ChallengeBlocked } from "@/components/challenge/challenge-blocked";
import { ChallengeComingSoon } from "@/components/challenge/challenge-coming-soon";
import { ChallengeHud } from "@/components/challenge/challenge-hud";
import {
  ChallengeQuestionCard,
  type ChallengeResultFlash,
} from "@/components/challenge/challenge-question-card";
import { ChallengeSummary } from "@/components/challenge/challenge-summary";
import { Button } from "@/components/ui/button";
import { useChallengeAntiCapture } from "@/hooks/use-challenge-anti-capture";
import { isTesterInvestorEmail } from "@/lib/admin/tester-allowlist";
import {
  ChallengeLoadError,
  loadDailyChallenge,
  shouldRedirectChallengeLoadToSignin,
  type ChallengeCompleteSaveResult,
} from "@/lib/challenge/load-daily-challenge";
import {
  RESULT_FLASH_MS,
  buildEduBlastDotStates,
  challengeGroupBadgeLabel,
  subjectIdToLabel,
} from "@/lib/challenge/meta";
import {
  CHALLENGE_SPEC,
  challengeMaxStrikes,
  challengeSessionDurationSec,
} from "@/lib/challenge/spec";
import {
  STUDENT_TRIALS_PER_LEVEL,
  isFailOutcome,
  trialGateFromCode,
  trialGateMessage,
  type LevelTrialsSnapshot,
} from "@/lib/challenge/trials";
import { isLineupComplete, lineupIds } from "@/lib/disciplines/selection";
import { useAppStore } from "@/store/useAppStore";
import type {
  ChallengeCompletePayload,
  ChallengeQuestion,
  ChallengeResult,
  ChallengeRoundOutcome,
  ChallengeSummaryReason,
} from "@/lib/types";

interface ChallengeSessionProps {
  campaignLevel: number;
  remainingAttempts?: number | null;
  failCount?: number;
  unlimitedTrials?: boolean;
  onComplete: (
    payload: ChallengeCompletePayload,
  ) => void | Promise<ChallengeCompleteSaveResult | void>;
  onQuit: () => void;
  onOpenPaywall?: () => void;
}

type SessionPhase = "playing" | "summary";

export function ChallengeSession({
  campaignLevel,
  remainingAttempts = null,
  failCount = 0,
  unlimitedTrials = false,
  onComplete,
  onQuit,
  onOpenPaywall,
}: ChallengeSessionProps) {
  const email = useAppStore((s) => s.email);
  const disciplineLineup = useAppStore((s) => s.disciplineLineup);
  const antiCapturePreference = useAppStore((s) => s.antiCaptureEnabled);
  // Freeze level/lineup for this run so win/fail progress sync cannot auto-restart a new test.
  const [runLevel] = useState(campaignLevel);
  const [runLineupIds] = useState(() =>
    isLineupComplete(disciplineLineup) ? lineupIds(disciplineLineup) : null,
  );
  const sessionSec = challengeSessionDurationSec(runLevel);
  const deferAnswerKey = !unlimitedTrials;
  // Free zone (L1–L3): screenshots allowed. Proctored tiers may still use the preference.
  const antiCaptureEnabled =
    runLevel >= 4 &&
    (isTesterInvestorEmail(email) ? antiCapturePreference : true);

  const maxStrikes = challengeMaxStrikes(runLevel);
  const { readPhaseSec } = CHALLENGE_SPEC;

  const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [comingSoon, setComingSoon] = useState(false);
  const [blockedGate, setBlockedGate] = useState<ReturnType<typeof trialGateFromCode>>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<ChallengeResult[]>([]);
  const [sessionLeft, setSessionLeft] = useState(sessionSec);
  const [phase, setPhase] = useState<SessionPhase>("playing");
  const [summaryReason, setSummaryReason] = useState<ChallengeSummaryReason | null>(null);
  const [serverTrials, setServerTrials] = useState<LevelTrialsSnapshot | null>(null);
  const [resultReviewMs, setResultReviewMs] = useState(RESULT_FLASH_MS);
  const [roundOutcomes, setRoundOutcomes] = useState<ChallengeRoundOutcome[]>([]);
  const [resultFlash, setResultFlash] = useState<ChallengeResultFlash | null>(null);
  const [confirmedIndex, setConfirmedIndex] = useState<number | null>(null);
  const [capturePortalReady, setCapturePortalReady] = useState(false);

  const resultsRef = useRef(results);
  const questionsRef = useRef(questions);
  const indexRef = useRef(index);
  const phaseRef = useRef(phase);
  const sessionEndRef = useRef(false);
  const sessionStartedAtRef = useRef<number | null>(null);
  const questionRoundStartedAtRef = useRef<number | null>(null);
  const answeredThisRoundRef = useRef(false);
  const advanceAfterResultRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAdvancingRef = useRef(false);
  const terminalAppliedRef = useRef(false);
  const campaignLevelAtStartRef = useRef(runLevel);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);
  useEffect(() => {
    questionsRef.current = questions;
    indexRef.current = index;
  }, [questions, index]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  // Load exactly once for this page visit — never auto-restart when store level/lineup changes.
  useEffect(() => {
    let cancelled = false;
    campaignLevelAtStartRef.current = runLevel;
    setLoadingQuestions(true);
    setLoadError(null);
    setComingSoon(false);
    setBlockedGate(null);
    setQuestions([]);
    setIndex(0);
    setResults([]);
    setRoundOutcomes([]);
    setResultFlash(null);
    setConfirmedIndex(null);
    setPhase("playing");
    setSummaryReason(null);
    sessionEndRef.current = false;
    terminalAppliedRef.current = false;

    void loadDailyChallenge(runLevel, runLineupIds)
      .then((built) => {
        if (cancelled) return;
        setQuestions(built);
        sessionStartedAtRef.current = Date.now();
        setSessionLeft(sessionSec);
        setLoadingQuestions(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (shouldRedirectChallengeLoadToSignin(err)) {
          window.location.replace("/signin?auth_notice=class_required");
          return;
        }
        const comingSoonError = err instanceof ChallengeLoadError && err.comingSoon;
        const gate = err instanceof ChallengeLoadError ? trialGateFromCode(err.gateCode) : null;
        setComingSoon(comingSoonError);
        setBlockedGate(gate);
        const message =
          err instanceof Error ? err.message : "Could not load today's questions";
        setLoadError(comingSoonError || gate ? null : message);
        setLoadingQuestions(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only load
  }, []);

  const lockResultReview = useCallback(() => {
    setResultReviewMs(RESULT_FLASH_MS);
    return RESULT_FLASH_MS;
  }, []);

  const pushLocalResult = useCallback((row: ChallengeResult) => {
    if (resultsRef.current.some((r) => r.questionId === row.questionId)) return;
    const next = [...resultsRef.current, row];
    resultsRef.current = next;
    setResults(next);
  }, []);

  const finalizeRun = useCallback(
    (reason: "strikes" | "time" | "finish") => {
      if (terminalAppliedRef.current || phaseRef.current !== "playing") return;
      terminalAppliedRef.current = true;
      sessionEndRef.current = true;

      const correct = resultsRef.current.filter((r) => r.isCorrect).length;
      const misses = resultsRef.current.filter((r) => !r.isCorrect).length;
      // Pass = finish the set with fewer than maxStrikes misses (L1: fail at 5/5).
      const passed = reason === "finish" && misses < maxStrikes;
      setPhase("summary");

      let summary: ChallengeSummaryReason;
      if (passed) {
        summary = "won";
      } else if (reason === "finish") {
        // Should be rare (finish path already checks strikes), keep a safe fail label.
        summary = "strikes";
      } else {
        summary = reason;
      }
      setSummaryReason(summary);

      void Promise.resolve(
        onComplete({
          reason: summary,
          correct,
          total: questionsRef.current.length,
          results: resultsRef.current,
          campaignLevelAtStart: campaignLevelAtStartRef.current,
        }),
      ).then((result) => {
        if (result?.trials) setServerTrials(result.trials);
      });
    },
    [maxStrikes, onComplete]
  );

  const proceedAfterAnswer = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    isAdvancingRef.current = false;
    const misses = resultsRef.current.filter((r) => !r.isCorrect).length;
    // Fail as soon as the strike limit is reached (L1: end at 5/5, not a 6th).
    if (misses >= maxStrikes) {
      finalizeRun("strikes");
      return;
    }
    const curIdx = indexRef.current;
    const qs = questionsRef.current;
    if (curIdx >= qs.length - 1) {
      finalizeRun("finish");
      return;
    }
    setIndex(curIdx + 1);
    setConfirmedIndex(null);
  }, [finalizeRun, maxStrikes]);

  useEffect(() => {
    if (phase !== "playing" || questions.length === 0) {
      return;
    }
    questionRoundStartedAtRef.current = Date.now();
    answeredThisRoundRef.current = false;
    setResultReviewMs(RESULT_FLASH_MS);
    setResultFlash(null);
    isAdvancingRef.current = false;
  }, [phase, index, questions.length]);

  useEffect(() => {
    if (phase !== "playing" || questions.length === 0) return;
    const sessionStart = sessionStartedAtRef.current;
    if (!sessionStart) return;

    const tick = () => {
      if (phaseRef.current !== "playing") return;

      const sessionEndMs = sessionStart + sessionSec * 1000;
      const nextSessionLeft = Math.max(0, Math.ceil((sessionEndMs - Date.now()) / 1000));
      setSessionLeft(nextSessionLeft);
      if (nextSessionLeft === 0 && !sessionEndRef.current) {
        sessionEndRef.current = true;
        finalizeRun("time");
      }
    };

    const id = window.setInterval(tick, 250);
    tick();
    return () => window.clearInterval(id);
  }, [phase, questions.length, sessionSec, finalizeRun]);

  const handleAnswer = (selectedIndex: number, timeTakenMs: number) => {
    const q = questionsRef.current[indexRef.current];
    if (!q || answeredThisRoundRef.current) return;
    answeredThisRoundRef.current = true;
    setConfirmedIndex(selectedIndex);
    lockResultReview();
    const isCorrect = selectedIndex === q.correctIndex;
    pushLocalResult({
      questionId: q.id,
      subjectId: q.subjectId,
      isCorrect,
      timeTakenMs,
      skipped: false,
    });
    setRoundOutcomes((o) => [...o, isCorrect ? "correct" : "wrong"]);
    setResultFlash({
      type: isCorrect ? "correct" : "wrong",
      message: deferAnswerKey
        ? "Recorded"
        : isCorrect
          ? "✓ Correct!"
          : `✗ Incorrect — correct answer was option ${q.correctIndex + 1}`,
    });
  };

  const handleSkip = useCallback(() => {
    const q = questionsRef.current[indexRef.current];
    if (!q || answeredThisRoundRef.current || phaseRef.current !== "playing") return;
    answeredThisRoundRef.current = true;
    lockResultReview();
    const started = questionRoundStartedAtRef.current ?? Date.now();
    const elapsed = Date.now() - started;
    pushLocalResult({
      questionId: q.id,
      subjectId: q.subjectId,
      isCorrect: false,
      timeTakenMs: elapsed,
      skipped: true,
    });
    setRoundOutcomes((o) => [...o, "skip"]);
    setResultFlash({
      type: "skip",
      message: deferAnswerKey ? "→ Skipped" : "→ Skipped — marked as unanswered",
    });
  }, [lockResultReview, pushLocalResult, deferAnswerKey]);

  const handleNext = useCallback(() => {
    if (isAdvancingRef.current) return;
    isAdvancingRef.current = true;
    if (advanceAfterResultRef.current) {
      clearTimeout(advanceAfterResultRef.current);
      advanceAfterResultRef.current = null;
    }
    setResultFlash(null);
    proceedAfterAnswer();
  }, [proceedAfterAnswer]);

  useEffect(() => {
    if (advanceAfterResultRef.current) {
      clearTimeout(advanceAfterResultRef.current);
      advanceAfterResultRef.current = null;
    }
    if (phase !== "playing" || results.length <= index) return;
    advanceAfterResultRef.current = setTimeout(() => {
      advanceAfterResultRef.current = null;
      handleNext();
    }, resultReviewMs);
    return () => {
      if (advanceAfterResultRef.current) {
        clearTimeout(advanceAfterResultRef.current);
        advanceAfterResultRef.current = null;
      }
    };
  }, [phase, index, results.length, handleNext, resultReviewMs]);

  const { showCaptureBlockOverlay, dismissCaptureBlockOverlay } = useChallengeAntiCapture({
    enabled: phase === "playing" && questions.length > 0 && antiCaptureEnabled,
    clipboardMessage:
      "Screenshots and screen capture are not available during this EduDeca challenge.",
  });

  useLayoutEffect(() => {
    setCapturePortalReady(true);
  }, []);

  const handleQuit = () => {
    if (phaseRef.current !== "playing") return;
    if (terminalAppliedRef.current) return;
    terminalAppliedRef.current = true;
    sessionEndRef.current = true;
    setPhase("summary");
    setSummaryReason("quit");
    const correct = resultsRef.current.filter((r) => r.isCorrect).length;
    void Promise.resolve(
      onComplete({
        reason: "quit",
        correct,
        total: questionsRef.current.length,
        results: resultsRef.current,
        campaignLevelAtStart: campaignLevelAtStartRef.current,
      }),
    );
  };

  const q = questions[index];
  const correctCount = results.filter((r) => r.isCorrect).length;
  const wrongCount = roundOutcomes.filter((o) => o === "wrong").length;
  const skipCount = roundOutcomes.filter((o) => o === "skip").length;
  const strikes = results.filter((r) => !r.isCorrect).length;
  const dotStates = buildEduBlastDotStates(questions.length, index, roundOutcomes);
  const answered = results.length > index;

  if (loadingQuestions) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm">Loading Level {runLevel} questions…</p>
      </div>
    );
  }

  if (comingSoon) {
    return <ChallengeComingSoon level={runLevel} onBack={onQuit} />;
  }

  if (blockedGate) {
    const copy = trialGateMessage(blockedGate);
    return (
      <ChallengeBlocked
        title={copy.code === "TRIALS_EXHAUSTED" ? "No attempts left" : "Not available"}
        description={copy.error}
        onBack={onQuit}
      />
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-semibold text-foreground">Couldn’t load questions</p>
        <p className="max-w-md text-sm text-muted-foreground">{loadError}</p>
        <Button type="button" variant="outline" onClick={onQuit}>
          Back to Home
        </Button>
      </div>
    );
  }

  if (phase === "summary" && summaryReason) {
    const optimisticRemaining = isFailOutcome(summaryReason)
      ? Math.max(0, (remainingAttempts ?? STUDENT_TRIALS_PER_LEVEL) - 1)
      : (remainingAttempts ?? STUDENT_TRIALS_PER_LEVEL);
    const remainingAfterThisRun = unlimitedTrials
      ? null
      : (serverTrials?.remaining ?? optimisticRemaining);
    const failCountAfterThisRun =
      serverTrials?.failCount ??
      (isFailOutcome(summaryReason) ? failCount + 1 : failCount);

    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-2 py-4">
        <ChallengeSummary
          reason={summaryReason}
          correct={correctCount}
          total={questions.length}
          campaignLevelAtStart={campaignLevelAtStartRef.current}
          showPaywallPrompt={
            summaryReason === "won" && campaignLevelAtStartRef.current === 3
          }
          onOpenPaywall={() => onOpenPaywall?.()}
          remainingAfterThisRun={remainingAfterThisRun}
          failCountAfterThisRun={failCountAfterThisRun}
          unlimitedTrials={unlimitedTrials}
        />
      </div>
    );
  }


  if (!q) {
    return <ChallengeComingSoon level={runLevel} onBack={onQuit} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChallengeHud
        campaignLevel={runLevel}
        sessionLeft={sessionLeft}
        strikes={strikes}
        maxStrikes={maxStrikes}
        questionIndex={index}
        questionTotal={questions.length}
        remainingAttempts={unlimitedTrials ? null : remainingAttempts}
        attemptLimit={STUDENT_TRIALS_PER_LEVEL}
        dotStates={dotStates}
        onQuit={handleQuit}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <ChallengeQuestionCard
          question={q}
          questionIndex={index}
          questionTotal={questions.length}
          subjectLabel={subjectIdToLabel(q.subjectId)}
          groupLabel={challengeGroupBadgeLabel({
            type: q.type,
            chapter: q.chapter,
          })}
          secondsLeft={sessionLeft}
          readPhaseSec={readPhaseSec}
          optionsPhaseSec={sessionSec}
          correctCount={correctCount}
          wrongCount={wrongCount}
          skipCount={skipCount}
          onConfirm={handleAnswer}
          onSkip={handleSkip}
          onNext={handleNext}
          answered={answered}
          confirmedIndex={confirmedIndex}
          resultFlash={resultFlash}
          resultPauseMs={resultReviewMs}
          watermarkText="EduDeca"
          revealDuringPlay={!deferAnswerKey}
          showExplanation={!deferAnswerKey}
        />
      </div>

      {capturePortalReady && antiCaptureEnabled && showCaptureBlockOverlay
        ? createPortal(
            <div
              className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-slate-950 px-6"
              role="status"
              aria-live="polite"
              style={{ isolation: "isolate" }}
            >
              <div className="relative max-w-md rounded-2xl border border-white/15 bg-slate-900/55 px-6 py-8 text-center shadow-2xl">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute right-3 top-3 h-8 rounded-full border-white/20 bg-black/30 px-3 text-xs font-semibold text-white hover:bg-white/10"
                  onClick={dismissCaptureBlockOverlay}
                >
                  OK
                </Button>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-slate-100">
                  <CameraOff className="h-6 w-6" aria-hidden />
                </div>
                <p className="text-base font-semibold tracking-tight text-slate-50">
                  Screenshots and screencapture are not allowed here.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-300/95">
                  Press OK to go back to your question.
                </p>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
