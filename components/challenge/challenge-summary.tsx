"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { ChallengeSummaryReason } from "@/lib/types";
import { challengeMaxStrikes } from "@/lib/challenge/spec";

interface ChallengeSummaryProps {
  reason: ChallengeSummaryReason;
  correct: number;
  total: number;
  campaignLevelAtStart: number;
  showPaywallPrompt: boolean;
  onOpenPaywall: () => void;
  onRestart?: () => void;
}

function summaryCopy(
  reason: ChallengeSummaryReason,
  correct: number,
  total: number,
  levelAtStart: number
): { title: string; description: string } {
  const maxStrikes = challengeMaxStrikes(levelAtStart);
  switch (reason) {
    case "won":
      if (levelAtStart === 3) {
        return {
          title: "Free zone complete!",
          description:
            "You cleared Level 3 without burning out your strikes. Unlock proctored rounds to continue to Level 4.",
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
        title: "Challenge quit",
        description: "You left the challenge. Progress from this run was not saved.",
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
}: ChallengeSummaryProps) {
  const router = useRouter();
  const { title, description } = summaryCopy(reason, correct, total, campaignLevelAtStart);
  const passed = reason === "won";

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
          {Math.round((correct / Math.max(total, 1)) * 100)}% accuracy · {passed ? "Passed" : "Strikes Reached"}
        </p>
      </div>
      <div>
        <h2 className="text-2xl font-black text-white">{title}</h2>
        <p className="mt-2 text-sm text-slate-300">{description}</p>
      </div>
      <div className="flex flex-col gap-3 pt-2">
        {showPaywallPrompt && passed ? (
          <Button
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 font-extrabold text-white shadow-lg shadow-emerald-500/30"
            onClick={onOpenPaywall}
          >
            Unlock proctored round · ₹999
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

        {!passed && reason !== "quit" ? (
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

