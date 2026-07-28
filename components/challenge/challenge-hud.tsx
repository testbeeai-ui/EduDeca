"use client";

import { Clock, Flame, LogOut, Zap } from "lucide-react";

import { challengeSessionDurationSec, formatChallengeClock } from "@/lib/challenge/spec";
import type { EduBlastDotState } from "@/lib/challenge/meta";
import { cn } from "@/lib/utils";

interface ChallengeHudProps {
  campaignLevel: number;
  sessionLeft: number;
  strikes: number;
  maxStrikes: number;
  questionIndex: number;
  questionTotal: number;
  dotStates: EduBlastDotState[];
  onQuit: () => void;
}

function dotClass(state: EduBlastDotState): string {
  switch (state) {
    case "correct":
      return "done";
    case "wrong":
      return "wrong";
    case "skip":
      return "skip";
    case "current":
      return "current";
    default:
      return "";
  }
}

export function ChallengeHud({
  campaignLevel,
  sessionLeft,
  strikes,
  maxStrikes,
  questionIndex,
  questionTotal,
  dotStates,
  onQuit,
}: ChallengeHudProps) {
  const strikeCount = Math.min(maxStrikes, strikes);
  const urgent = sessionLeft <= 60;
  const sessionTotalSec = challengeSessionDurationSec();
  const sessionPct = Math.max(0, Math.min(100, (sessionLeft / sessionTotalSec) * 100));

  return (
    <header className="mb-3 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#121820]/95 shadow-lg shadow-black/20 sm:mb-4 sm:rounded-2xl">
      <div className="h-0.5 bg-white/5 sm:h-1">
        <div
          className={cn("h-full transition-all duration-500", urgent ? "bg-destructive" : "bg-primary")}
          style={{ width: `${sessionPct}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary sm:px-3 sm:py-1 sm:text-xs">
            <Zap className="size-3 sm:size-3.5" />
            L{campaignLevel}
          </span>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tabular-nums sm:px-3 sm:py-1 sm:text-xs",
              urgent
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-white/10 bg-white/5 text-foreground"
            )}
          >
            <Clock className="size-3 sm:size-3.5" />
            {formatChallengeClock(sessionLeft)}
          </span>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold sm:px-3 sm:py-1 sm:text-xs",
              strikeCount >= 2
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-orange-500/30 bg-orange-500/10 text-orange-300"
            )}
          >
            <Flame className="size-3 sm:size-3.5" />
            {strikeCount}/{maxStrikes}
          </span>

          <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
            <div className="ebc-qprogress flex gap-1" aria-label="Question progress">
              {dotStates.map((state, i) => (
                <span key={i} className={cn("ebc-qp-dot", dotClass(state))} />
              ))}
            </div>
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
              {questionIndex + 1}/{questionTotal}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onQuit}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground sm:px-3 sm:py-1.5 sm:text-xs"
        >
          <LogOut className="size-3 sm:size-3.5" />
          Quit
        </button>
      </div>

      <div className="flex items-center justify-between border-t border-white/5 px-3 py-1.5 md:hidden">
        <div className="ebc-qprogress flex gap-1" aria-label="Question progress">
          {dotStates.map((state, i) => (
            <span key={i} className={cn("ebc-qp-dot", dotClass(state))} />
          ))}
        </div>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          Q {questionIndex + 1}/{questionTotal}
        </span>
      </div>
    </header>
  );
}
