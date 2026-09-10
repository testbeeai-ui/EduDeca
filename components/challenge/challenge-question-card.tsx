"use client";

import { useEffect, useRef, useState } from "react";

import { MathText } from "@/components/common/math-text";
import { RESULT_FLASH_MS } from "@/lib/challenge/meta";
import { formatChallengeClock } from "@/lib/challenge/spec";
import type { ChallengeQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";

const RING_RADIUS = 22;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export type ChallengeResultFlash = {
  type: "correct" | "wrong" | "skip";
  message: string;
};

export interface ChallengeQuestionCardProps {
  question: ChallengeQuestion;
  questionIndex: number;
  questionTotal: number;
  subjectLabel: string;
  groupLabel?: string | null;
  secondsLeft: number;
  readPhaseSec: number;
  optionsPhaseSec: number;
  correctCount: number;
  wrongCount: number;
  skipCount: number;
  onConfirm: (selectedIndex: number, timeTakenMs: number) => void;
  onSkip?: () => void;
  onNext?: () => void;
  answered?: boolean;
  selectedIndex?: number | null;
  resultFlash?: ChallengeResultFlash | null;
  disableInteraction?: boolean;
  watermarkText?: string;
  showExplanation?: boolean;
  confirmedIndex?: number | null;
  disableAutoAdvance?: boolean;
  resultPauseMs?: number;
  revealDuringPlay?: boolean;
}

export function ChallengeQuestionCard({
  question,
  questionIndex,
  questionTotal,
  subjectLabel,
  groupLabel = null,
  secondsLeft,
  readPhaseSec,
  optionsPhaseSec,
  correctCount,
  wrongCount,
  skipCount,
  onConfirm,
  onSkip,
  onNext,
  answered = false,
  selectedIndex: selectedIndexProp,
  resultFlash,
  disableInteraction = false,
  watermarkText,
  showExplanation = true,
  confirmedIndex,
  disableAutoAdvance = false,
  resultPauseMs = RESULT_FLASH_MS,
  revealDuringPlay = true,
}: ChallengeQuestionCardProps) {
  const [localSelected, setLocalSelected] = useState<number | null>(null);
  const startTimeRef = useRef(Date.now());
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedIndex = selectedIndexProp !== undefined ? selectedIndexProp : localSelected;

  useEffect(() => {
    startTimeRef.current = Date.now();
    setLocalSelected(null);
    return () => {
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
        autoAdvanceRef.current = null;
      }
    };
  }, [question.id]);

  useEffect(() => {
    if (!answered || !onNext || disableAutoAdvance) return;
    autoAdvanceRef.current = setTimeout(() => {
      autoAdvanceRef.current = null;
      onNext();
    }, resultPauseMs);
    return () => {
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
        autoAdvanceRef.current = null;
      }
    };
  }, [answered, onNext, disableAutoAdvance, resultPauseMs, question.id]);

  const options = question.options;
  const correctIndex = question.correctIndex;
  const explanation = question.explanation?.trim() ?? "";

  const canSelect = !answered && !disableInteraction;
  const pickedIndex = confirmedIndex ?? selectedIndex;

  const isReadPhase = !answered && readPhaseSec > 0 && secondsLeft > optionsPhaseSec;
  const isAnswerPhase = !answered && !isReadPhase && secondsLeft > 0;
  const isUrgent = isAnswerPhase && secondsLeft <= 60;
  const phaseBannerClass = answered ? "read" : isUrgent ? "urgent" : isReadPhase ? "read" : "answer";
  const phaseLabel = answered
    ? "RESULT"
    : isUrgent
      ? "ANSWER NOW"
      : isReadPhase
        ? "READ-ONLY PHASE"
        : "LEVEL TIMER";
  const untilChoicesSec = Math.max(0, secondsLeft - optionsPhaseSec);
  const phaseTimerDisplay = formatChallengeClock(
    isReadPhase ? untilChoicesSec : secondsLeft,
  );
  const phaseSub = answered
    ? (resultFlash?.message ?? "Recorded")
    : isReadPhase
      ? "Answer options unlock in"
      : "Finish this level before time runs out";
  const ringTotal = isReadPhase ? readPhaseSec : Math.max(1, optionsPhaseSec);
  const ringCurrent = isReadPhase
    ? untilChoicesSec
    : Math.max(0, secondsLeft);
  const ringRatio = ringTotal > 0 ? Math.max(0, Math.min(1, ringCurrent / ringTotal)) : 0;
  const ringOffset = RING_CIRCUMFERENCE * (1 - ringRatio);
  const ringStroke = answered
    ? "var(--ebc-teal)"
    : isReadPhase
      ? "var(--ebc-blue)"
      : isUrgent
        ? "var(--ebc-coral)"
        : "var(--ebc-teal)";

  const handleSelect = (i: number) => {
    if (!canSelect) return;
    setLocalSelected(i);
    onConfirm(i, Date.now() - startTimeRef.current);
  };

  const handleSkipClick = () => {
    if (answered || disableInteraction || !onSkip) return;
    onSkip();
  };

  const confirmLabel = answered ? "Next Question →" : "Select an option to answer";

  const resultFlashClass =
    resultFlash?.type === "correct"
      ? "ebc-rf-correct"
      : resultFlash?.type === "wrong"
        ? "ebc-rf-wrong"
        : resultFlash?.type === "skip"
          ? "ebc-rf-skip"
          : "";

  return (
    <div className="edu-blast-challenge edu-blast-challenge--viewport">
      <div className="ebc-card relative">
        {watermarkText ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-3 top-1/2 z-0 -translate-y-1/2 select-none text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white/10"
          >
            {watermarkText}
          </div>
        ) : null}

        <div className="demo-mm-cap-shield-soft pointer-events-none absolute inset-0 z-[1]" aria-hidden />

        <div className="ebc-card-inner relative z-[2]">
          <div className="ebc-card-topbar">
            <div className="ebc-subject-tag">{subjectLabel}</div>
            {groupLabel ? (
              <div className="ebc-group-tag" title={groupLabel}>
                {groupLabel}
              </div>
            ) : null}
            <div className="ebc-q-counter ml-auto lg:hidden">
              {questionIndex + 1} / {questionTotal}
            </div>
          </div>

          <div className="ebc-card-body">
            <div className="ebc-left-col">
              <div className="ebc-question-area">
                <div className="ebc-q-label">Question</div>
                <MathText as="p" className="ebc-q-text">
                  {question.stem}
                </MathText>
              </div>

              <div className="ebc-ring-wrap" aria-hidden>
                <svg className="ebc-ring-svg" width="56" height="56" viewBox="0 0 56 56">
                  <circle className="ebc-ring-track" cx="28" cy="28" r={RING_RADIUS} />
                  <circle
                    className="ebc-ring-fill"
                    cx="28"
                    cy="28"
                    r={RING_RADIUS}
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={ringOffset}
                    stroke={ringStroke}
                  />
                </svg>
              </div>

              <div
                className={cn("ebc-phase-banner", phaseBannerClass)}
                role="status"
                aria-live="polite"
                aria-label={`${phaseLabel}. ${phaseTimerDisplay}. ${phaseSub}`}
              >
                <div className="ebc-phase-sub">{phaseSub}</div>
                <div className="ebc-phase-timer">{phaseTimerDisplay}</div>
                <div className="ebc-phase-label">{phaseLabel}</div>
              </div>
            </div>

            <div className="ebc-right-col">
              <div className="ebc-options-area mt-4">
                {options.map((option, i) => {
                  const showReveal = answered && revealDuringPlay;
                  const isSelected = !showReveal && selectedIndex === i;
                  const isCorrectPick =
                    showReveal && pickedIndex === i && pickedIndex === correctIndex;
                  const isWrongPick =
                    showReveal && pickedIndex === i && pickedIndex !== correctIndex;
                  const isRevealCorrect =
                    showReveal && i === correctIndex && pickedIndex !== correctIndex;

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelect(i)}
                      disabled={answered}
                      className={cn(
                        "ebc-option",
                        canSelect && "available",
                        isSelected && "selected",
                        isCorrectPick && "correct",
                        isWrongPick && "wrong-sel",
                        isRevealCorrect && "reveal-correct"
                      )}
                    >
                      <div className="ebc-opt-num">{i + 1}</div>
                      <MathText as="div" className="ebc-opt-text min-w-0">
                        {option}
                      </MathText>
                      <span className="ebc-opt-tick" aria-hidden>
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>

              {answered && resultFlash ? (
                <div className={cn("ebc-result-flash", resultFlashClass)}>{resultFlash.message}</div>
              ) : (
                <div className="ebc-result-flash ebc-result-flash--empty" aria-hidden />
              )}

              {answered && showExplanation && revealDuringPlay && explanation ? (
                <MathText as="div" className="ebc-explanation">
                  {explanation}
                </MathText>
              ) : null}
            </div>
          </div>

          <div className="ebc-card-footer">
            <div className="ebc-action-row">
              <button
                type="button"
                className="ebc-btn-skip"
                onClick={handleSkipClick}
                disabled={answered || disableInteraction}
              >
                Skip →
              </button>
              <button
                type="button"
                className={cn("ebc-btn-confirm", answered ? "active" : "inactive")}
                onClick={() => onNext?.()}
                disabled={!answered}
              >
                <span>{confirmLabel}</span>
              </button>
            </div>

            <div className="ebc-score-bar">
              <div className="ebc-sc-item">
                <div className="ebc-sc-dot" style={{ background: "var(--ebc-teal)" }} />
                <span className="ebc-sc-val">{correctCount}</span>
                <span className="ebc-sc-lbl">correct</span>
              </div>
              <div className="ebc-sc-item">
                <div className="ebc-sc-dot" style={{ background: "var(--ebc-coral)" }} />
                <span className="ebc-sc-val">{wrongCount}</span>
                <span className="ebc-sc-lbl">wrong</span>
              </div>
              <div className="ebc-sc-item">
                <div className="ebc-sc-dot" style={{ background: "var(--ebc-amber)" }} />
                <span className="ebc-sc-val">{skipCount}</span>
                <span className="ebc-sc-lbl">skipped</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
