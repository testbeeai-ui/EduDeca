"use client";

import { useRouter } from "next/navigation";
import { HelpCircle } from "lucide-react";

import { failAttemptsPanel, failOutcomeHeadline } from "@/lib/challenge/attempts-copy";
import { LEVEL4_HOME_CTA } from "@/lib/challenge/level4-gate-copy";
import { challengeMaxStrikes } from "@/lib/challenge/spec";
import { STUDENT_TRIALS_PER_LEVEL } from "@/lib/challenge/trials";
import type { ChallengeSummaryReason } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChallengeSummaryProps {
  reason: ChallengeSummaryReason;
  correct: number;
  total: number;
  campaignLevelAtStart: number;
  showPaywallPrompt: boolean;
  onOpenPaywall?: () => void;
  onRestart?: () => void;
  remainingAfterThisRun?: number | null;
  failCountAfterThisRun?: number | null;
  unlimitedTrials?: boolean;
}

function summaryCopy(
  reason: ChallengeSummaryReason,
  correct: number,
  total: number,
  levelAtStart: number,
): { title: string; description: string } {
  const maxStrikes = challengeMaxStrikes(levelAtStart);
  switch (reason) {
    case "won":
      if (levelAtStart === 3) {
        return {
          title: "Free zone complete!",
          description:
            "You cleared Level 3. Continue to unlock Level 4 priority access for the proctored zone.",
        };
      }
      return {
        title: "Level passed!",
        description: `You scored ${correct}/${total} and stayed under ${maxStrikes} strikes. Level ${levelAtStart + 1} unlocks tomorrow — come back then to continue.`,
      };
    case "strikes":
      return {
        title: `${maxStrikes} strikes limit reached`,
        description: `You hit ${maxStrikes} wrong or unanswered questions. Return to Home, then start the challenge again when you're ready.`,
      };
    case "time":
      return {
        title: "Time's up",
        description: "The session timer ran out before you could finish.",
      };
    case "below_threshold":
      return {
        title: "Challenge failed",
        description: `Stay under ${maxStrikes} strikes and finish all questions to advance. You got ${correct}/${total}.`,
      };
    case "quit":
      return {
        title: "Round left early",
        description:
          "You left before this round finished. That does not use an attempt. Your remaining tries are unchanged.",
      };
    default: {
      const _exhaustive: never = reason;
      return { title: String(_exhaustive), description: "" };
    }
  }
}

export function ChallengeSummary({
  reason,
  correct,
  total,
  campaignLevelAtStart,
  showPaywallPrompt,
  onOpenPaywall,
  onRestart,
  remainingAfterThisRun = null,
  failCountAfterThisRun = null,
  unlimitedTrials = false,
}: ChallengeSummaryProps) {
  const router = useRouter();
  const attempts = failAttemptsPanel({
    reason,
    remaining: remainingAfterThisRun,
    failCount: failCountAfterThisRun,
    unlimited: unlimitedTrials,
    limit: STUDENT_TRIALS_PER_LEVEL,
  });
  const failHeadline = failOutcomeHeadline({
    reason,
    exhausted: attempts?.exhausted === true,
    level: campaignLevelAtStart,
    maxStrikes: challengeMaxStrikes(campaignLevelAtStart),
    correct,
    total,
  });
  const { title, description } = failHeadline ?? summaryCopy(
    reason,
    correct,
    total,
    campaignLevelAtStart,
  );
  const passed = reason === "won";
  const statusLine = passed
    ? "Passed"
    : reason === "quit"
      ? "Left early"
      : attempts?.exhausted
        ? "Level closed"
        : "Strikes Reached";

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 rounded-2xl border border-white/15 bg-slate-950/85 p-6 text-center shadow-2xl shadow-emerald-950/20 backdrop-blur-xl lg:max-w-xl lg:p-8">
      <div
        className={
          passed
            ? "mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-500/20 text-3xl font-extrabold text-emerald-400 border border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.35)]"
            : "mx-auto flex size-20 items-center justify-center rounded-full bg-rose-500/20 text-3xl font-extrabold text-rose-400 border border-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.35)]"
        }
      >
        {passed ? "✓" : "✗"}
      </div>
      <div>
        <p className="text-4xl font-extrabold tabular-nums text-white">
          {correct}/{total}
        </p>
        <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
          {Math.round((correct / Math.max(total, 1)) * 100)}% accuracy · {statusLine}
        </p>
      </div>
      <div>
        <h2 className="text-2xl font-black text-white">{title}</h2>
        <p className="mt-2 text-sm text-slate-300">{description}</p>
      </div>
      {attempts ? (
        <div
          className={cn(
            "rounded-xl border p-4 text-left",
            attempts.exhausted
              ? "border-rose-500/30 bg-rose-500/10"
              : attempts.unlimited
                ? "border-white/15 bg-white/5"
                : "border-amber-500/25 bg-amber-500/10",
          )}
        >
          <div className="flex items-center justify-center gap-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Level {campaignLevelAtStart} attempts
            </p>
            <TooltipProvider delayDuration={120}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex size-7 items-center justify-center rounded-full border border-white/35 bg-white/10 text-slate-200 shadow-sm transition-colors hover:border-emerald-400/60 hover:bg-emerald-500/15 hover:text-white"
                    aria-label="How level attempts work"
                  >
                    <HelpCircle className="size-4" strokeWidth={2.25} />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  sideOffset={10}
                  className="max-w-[280px] overflow-visible rounded-xl border-2 border-emerald-400/55 bg-slate-950 px-4 py-3 text-left text-[13px] font-medium leading-relaxed text-slate-100 shadow-[0_16px_40px_rgba(0,0,0,0.65)]"
                >
                  {attempts.hint}
                  <TooltipArrow className="fill-slate-950" width={12} height={7} />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="mt-3 flex gap-1" aria-hidden>
            {Array.from({ length: attempts.limit }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  i < attempts.used
                    ? attempts.exhausted
                      ? "bg-rose-400"
                      : attempts.unlimited
                        ? "bg-slate-400"
                        : "bg-amber-400"
                    : "bg-white/10",
                )}
              />
            ))}
          </div>
          <p
            className={cn(
              "mt-3 text-center text-sm font-semibold",
              attempts.exhausted
                ? "text-rose-200"
                : attempts.unlimited
                  ? "text-slate-300"
                  : "text-amber-200",
            )}
          >
            {attempts.description}
          </p>
        </div>
      ) : null}
      <div className="flex flex-col gap-3 pt-2">
        {showPaywallPrompt && passed ? (
          <Button
            className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 font-extrabold text-white shadow-lg shadow-violet-500/30"
            onClick={() => {
              if (onOpenPaywall) onOpenPaywall();
              else router.push("/challenge");
            }}
          >
            {LEVEL4_HOME_CTA}
          </Button>
        ) : null}

        <Button
          size="lg"
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold shadow-lg shadow-emerald-500/25"
          onClick={() => router.push("/home")}
        >
          Return to Home Page
        </Button>

        {onRestart && (
          <Button
            variant="outline"
            size="lg"
            className="w-full border-white/20 bg-white/5 font-bold text-slate-200 hover:bg-white/10"
            onClick={onRestart}
          >
            Try Again ↻
          </Button>
        )}

        {!passed ? (
          <Button
            variant="ghost"
            className="w-full text-slate-400 hover:text-white"
            onClick={() => router.push("/levels")}
          >
            View Level Map
          </Button>
        ) : null}
      </div>
    </div>
  );
}
