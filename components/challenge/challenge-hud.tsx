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
  const sessionTotalSec = challengeSessionDurationSec(campaignLevel);
  const sessionPct = Math.max(0, Math.min(100, (sessionLeft / sessionTotalSec) * 100));

  return (
    <header className="mb-3 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-slate-950/80 backdrop-blur-xl shadow-2xl shadow-emerald-950/20 sm:mb-4">
      <div className="h-1 bg-white/10">
        <div
          className={cn(
            "h-full transition-all duration-500 rounded-r-full shadow-sm",
            urgent
              ? "bg-gradient-to-r from-rose-500 to-red-600 shadow-rose-500/50 animate-pulse"
              : "bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-emerald-500/50"
          )}
          style={{ width: `${sessionPct}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 sm:gap-4 sm:px-5 sm:py-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-extrabold text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
            <Zap className="size-3.5 fill-emerald-400 text-emerald-300" />
            Level {campaignLevel}
          </span>

          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold tabular-nums transition-all",
              urgent
                ? "border-rose-500/50 bg-rose-500/20 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse"
                : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
            )}
          >
            <Clock className="size-3.5 text-cyan-400" />
            {formatChallengeClock(sessionLeft)}
          </span>

          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold transition-all",
              strikeCount >= 2
                ? "border-rose-500/50 bg-rose-500/20 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                : "border-amber-500/40 bg-amber-500/15 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
            )}
          >
            <Flame className="size-3.5 text-amber-400 fill-amber-400/30" />
            {strikeCount}/{maxStrikes} Strikes
          </span>

          <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
            <div className="ebc-qprogress flex gap-1.5" aria-label="Question progress">
              {dotStates.map((state, i) => (
                <span key={i} className={cn("ebc-qp-dot", dotClass(state))} />
              ))}
            </div>
            <span className="shrink-0 text-xs font-bold tabular-nums text-slate-400">
              Q {questionIndex + 1} of {questionTotal}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onQuit}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition-all hover:border-rose-500/40 hover:bg-rose-500/15 hover:text-rose-300"
        >
          <LogOut className="size-3.5" />
          Quit
        </button>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 px-3.5 py-2 md:hidden">
        <div className="ebc-qprogress flex gap-1.5" aria-label="Question progress">
          {dotStates.map((state, i) => (
            <span key={i} className={cn("ebc-qp-dot", dotClass(state))} />
          ))}
        </div>
        <span className="text-xs font-bold tabular-nums text-slate-300">
          Q {questionIndex + 1} of {questionTotal}
        </span>
      </div>
    </header>
  );
}

