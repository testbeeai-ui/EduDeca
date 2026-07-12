"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CameraOff } from "lucide-react";

import { buildDailyChallenge } from "@/data/challenge-questions";
import { ChallengeHud } from "@/components/challenge/challenge-hud";
import {
  ChallengeQuestionCard,
  type ChallengeResultFlash,
} from "@/components/challenge/challenge-question-card";
import { ChallengeSummary } from "@/components/challenge/challenge-summary";
import { Button } from "@/components/ui/button";
import { useChallengeAntiCapture } from "@/hooks/use-challenge-anti-capture";
import { useAppStore } from "@/store/useAppStore";
import {
  buildEduBlastDotStates,
  difficultyRatingToLabel,
  remainingOptionsReviewMs,
  subjectIdToLabel,
} from "@/lib/challenge/meta";
import {
  CHALLENGE_SPEC,
  challengePerQuestionTotalSec,
  challengeSessionDurationSec,
} from "@/lib/challenge/spec";
import type {
  ChallengeCompletePayload,
  ChallengeQuestion,
  ChallengeResult,
  ChallengeRoundOutcome,
  ChallengeSummaryReason,
} from "@/lib/types";

interface ChallengeSessionProps {
  campaignLevel: number;
  onComplete: (payload: ChallengeCompletePayload) => void;
  onQuit: () => void;
  onOpenPaywall?: () => void;
}

type SessionPhase = "playing" | "summary";

export function ChallengeSession({ campaignLevel, onComplete, onQuit, onOpenPaywall }: ChallengeSessionProps) {
  const antiCaptureEnabled = useAppStore((s) => s.antiCaptureEnabled);
  const sessionSec = challengeSessionDurationSec();
  const perQuestionTotalSec = challengePerQuestionTotalSec();
  const { readPhaseSec, optionsPhaseSec, maxStrikes, minCorrect } = CHALLENGE_SPEC;

  const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<ChallengeResult[]>([]);
  const [sessionLeft, setSessionLeft] = useState(sessionSec);
  const [phase, setPhase] = useState<SessionPhase>("playing");
  const [summaryReason, setSummaryReason] = useState<ChallengeSummaryReason | null>(null);
  const [perQuestionLeft, setPerQuestionLeft] = useState(perQuestionTotalSec);
  const [resultReviewMs, setResultReviewMs] = useState(() =>
    remainingOptionsReviewMs(optionsPhaseSec, optionsPhaseSec)
  );
  const [roundOutcomes, setRoundOutcomes] = useState<ChallengeRoundOutcome[]>([]);
  const [resultFlash, setResultFlash] = useState<ChallengeResultFlash | null>(null);
  const [confirmedIndex, setConfirmedIndex] = useState<number | null>(null);
  const [capturePortalReady, setCapturePortalReady] = useState(false);

  const resultsRef = useRef(results);
  const questionsRef = useRef(questions);
  const indexRef = useRef(index);
  const phaseRef = useRef(phase);
  const perQuestionLeftRef = useRef(perQuestionLeft);
  const sessionEndRef = useRef(false);
  const sessionStartedAtRef = useRef<number | null>(null);
  const questionRoundDeadlineRef = useRef<number | null>(null);
  const questionRoundStartedAtRef = useRef<number | null>(null);
  const answeredThisRoundRef = useRef(false);
  const questionTimeoutFiredRef = useRef(false);
  const advanceAfterResultRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAdvancingRef = useRef(false);
  const terminalAppliedRef = useRef(false);
  const campaignLevelAtStartRef = useRef(campaignLevel);

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
  useEffect(() => {
    perQuestionLeftRef.current = perQuestionLeft;
  }, [perQuestionLeft]);

  useEffect(() => {
    campaignLevelAtStartRef.current = campaignLevel;
    const built = buildDailyChallenge(campaignLevel);
    setQuestions(built);
    setIndex(0);
    setResults([]);
    setRoundOutcomes([]);
    setResultFlash(null);
    setConfirmedIndex(null);
    setPhase("playing");
    setSummaryReason(null);
    sessionEndRef.current = false;
    sessionStartedAtRef.current = Date.now();
    setSessionLeft(sessionSec);
    terminalAppliedRef.current = false;
  }, [campaignLevel, sessionSec]);

  const lockResultReviewFromRemaining = useCallback(() => {
    const ms = remainingOptionsReviewMs(perQuestionLeftRef.current, optionsPhaseSec);
    setResultReviewMs(ms);
    return ms;
  }, [optionsPhaseSec]);

  const pushLocalResult = useCallback((row: ChallengeResult) => {
    if (resultsRef.current.some((r) => r.questionId === row.questionId)) return;
    const next = [...resultsRef.current, row];
    resultsRef.current = next;
    setResults(next);
  }, []);

  const finalizeRun = useCallback(
    (reason: "strikes" | "time" | "finish") => {
      const correct = resultsRef.current.filter((r) => r.isCorrect).length;
      const passedBar = correct >= minCorrect;
      setPhase("summary");

      let summary: ChallengeSummaryReason;
      if (passedBar) {
        summary = "won";
      } else {
        summary = reason === "finish" ? "below_threshold" : reason;
      }
      setSummaryReason(summary);

      if (!terminalAppliedRef.current) {
        terminalAppliedRef.current = true;
        onComplete({
          reason: summary,
          correct,
          total: questionsRef.current.length,
          results: resultsRef.current,
          campaignLevelAtStart: campaignLevelAtStartRef.current,
        });
      }
    },
    [minCorrect, onComplete]
  );

  const proceedAfterAnswer = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    isAdvancingRef.current = false;
    const misses = resultsRef.current.filter((r) => !r.isCorrect).length;
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

  const handleQuestionTimeout = useCallback(() => {
    const q = questionsRef.current[indexRef.current];
    if (!q || phaseRef.current !== "playing") return;
    answeredThisRoundRef.current = true;
    lockResultReviewFromRemaining();
    questionRoundDeadlineRef.current = null;
    const started = questionRoundStartedAtRef.current ?? Date.now();
    const elapsed = Date.now() - started;
    setRoundOutcomes((o) => [...o, "skip"]);
    setResultFlash({
      type: "skip",
      message: "⏱ Time up — marked as unanswered",
    });
    pushLocalResult({
      questionId: q.id,
      subjectId: q.subjectId,
      isCorrect: false,
      timeTakenMs: elapsed,
    });
  }, [lockResultReviewFromRemaining, pushLocalResult]);

  useEffect(() => {
    if (phase !== "playing" || questions.length === 0) {
      questionRoundDeadlineRef.current = null;
      setPerQuestionLeft(perQuestionTotalSec);
      return;
    }
    questionRoundDeadlineRef.current = Date.now() + perQuestionTotalSec * 1000;
    questionRoundStartedAtRef.current = Date.now();
    answeredThisRoundRef.current = false;
    questionTimeoutFiredRef.current = false;
    setPerQuestionLeft(perQuestionTotalSec);
    setResultReviewMs(remainingOptionsReviewMs(optionsPhaseSec, optionsPhaseSec));
    setResultFlash(null);
    isAdvancingRef.current = false;
  }, [phase, index, questions.length, perQuestionTotalSec, optionsPhaseSec]);

  useEffect(() => {
    if (phase !== "playing" || questions.length === 0) return;
    const sessionStart = sessionStartedAtRef.current;
    if (!sessionStart) return;

    let timeoutInFlight = false;

    const tick = () => {
      if (phaseRef.current !== "playing") return;

      const sessionEndMs = sessionStart + sessionSec * 1000;
      const nextSessionLeft = Math.max(0, Math.ceil((sessionEndMs - Date.now()) / 1000));
      setSessionLeft(nextSessionLeft);
      if (nextSessionLeft === 0 && !sessionEndRef.current) {
        sessionEndRef.current = true;
        finalizeRun("time");
        return;
      }

      const qEnd = questionRoundDeadlineRef.current;
      if (qEnd && !answeredThisRoundRef.current) {
        const qLeft = Math.max(0, Math.ceil((qEnd - Date.now()) / 1000));
        setPerQuestionLeft(qLeft);
        if (qLeft === 0 && !questionTimeoutFiredRef.current && !timeoutInFlight) {
          questionTimeoutFiredRef.current = true;
          timeoutInFlight = true;
          handleQuestionTimeout();
          timeoutInFlight = false;
        }
      }
    };

    const id = window.setInterval(tick, 250);
    tick();
    return () => window.clearInterval(id);
  }, [phase, questions.length, index, sessionSec, finalizeRun, handleQuestionTimeout]);

  const handleAnswer = (selectedIndex: number, timeTakenMs: number) => {
    const q = questionsRef.current[indexRef.current];
    if (!q || answeredThisRoundRef.current) return;
    answeredThisRoundRef.current = true;
    setConfirmedIndex(selectedIndex);
    lockResultReviewFromRemaining();
    questionRoundDeadlineRef.current = null;
    const isCorrect = selectedIndex === q.correctIndex;
    pushLocalResult({
      questionId: q.id,
      subjectId: q.subjectId,
      isCorrect,
      timeTakenMs,
    });
    setRoundOutcomes((o) => [...o, isCorrect ? "correct" : "wrong"]);
    setResultFlash({
      type: isCorrect ? "correct" : "wrong",
      message: isCorrect
        ? "✓ Correct!"
        : `✗ Incorrect — correct answer was option ${q.correctIndex + 1}`,
    });
  };

  const handleSkip = useCallback(() => {
    const q = questionsRef.current[indexRef.current];
    if (!q || answeredThisRoundRef.current || phaseRef.current !== "playing") return;
    answeredThisRoundRef.current = true;
    lockResultReviewFromRemaining();
    questionRoundDeadlineRef.current = null;
    const started = questionRoundStartedAtRef.current ?? Date.now();
    const elapsed = Date.now() - started;
    pushLocalResult({
      questionId: q.id,
      subjectId: q.subjectId,
      isCorrect: false,
      timeTakenMs: elapsed,
    });
    setRoundOutcomes((o) => [...o, "skip"]);
    setResultFlash({
      type: "skip",
      message: "→ Skipped — marked as unanswered",
    });
  }, [lockResultReviewFromRemaining, pushLocalResult]);

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
    setPhase("summary");
    setSummaryReason("quit");
    onQuit();
  };

  const q = questions[index];
  const correctCount = results.filter((r) => r.isCorrect).length;
  const wrongCount = roundOutcomes.filter((o) => o === "wrong").length;
  const skipCount = roundOutcomes.filter((o) => o === "skip").length;
  const strikes = results.filter((r) => !r.isCorrect).length;
  const dotStates = buildEduBlastDotStates(questions.length, index, roundOutcomes);
  const answered = results.length > index;

  if (phase === "summary" && summaryReason) {
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
        />
      </div>
    );
  }

  if (!q) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center text-muted-foreground">
        Loading challenge…
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChallengeHud
        campaignLevel={campaignLevel}
        sessionLeft={sessionLeft}
        strikes={strikes}
        maxStrikes={maxStrikes}
        questionIndex={index}
        questionTotal={questions.length}
        dotStates={dotStates}
        onQuit={handleQuit}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <ChallengeQuestionCard
          question={q}
          questionIndex={index}
          questionTotal={questions.length}
          subjectLabel={subjectIdToLabel(q.subjectId)}
          difficultyLabel={difficultyRatingToLabel(q.difficultyRating ?? 3)}
          secondsLeft={perQuestionLeft}
          readPhaseSec={readPhaseSec}
          optionsPhaseSec={optionsPhaseSec}
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
