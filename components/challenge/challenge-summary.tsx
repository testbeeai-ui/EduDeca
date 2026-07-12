"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { ChallengeSummaryReason } from "@/lib/types";
import { CHALLENGE_SPEC } from "@/lib/challenge/spec";

interface ChallengeSummaryProps {
  reason: ChallengeSummaryReason;
  correct: number;
  total: number;
  campaignLevelAtStart: number;
  showPaywallPrompt: boolean;
  onOpenPaywall: () => void;
}

function summaryCopy(
  reason: ChallengeSummaryReason,
  correct: number,
  total: number,
  levelAtStart: number
): { title: string; description: string } {
  switch (reason) {
    case "won":
      if (levelAtStart === 3) {
        return {
          title: "Free zone complete!",
          description:
            "You cleared Level 3 with 80%+ accuracy. Unlock proctored rounds to continue to Level 4.",
        };
      }
      return {
        title: "Level passed!",
        description: `You scored ${correct}/${total}. You're now Level ${levelAtStart + 1}.`,
      };
    case "strikes":
      return {
        title: "3 strikes — challenge ended",
        description: "Three incorrect answers ended your run. Try again tomorrow.",
      };
    case "time":
      return {
        title: "Time's up",
        description: "The session timer ran out before you could finish.",
      };
    case "below_threshold":
      return {
        title: "Below pass threshold",
        description: `Need ${CHALLENGE_SPEC.minCorrect}/${total} correct to advance. You got ${correct}.`,
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
}: ChallengeSummaryProps) {
  const router = useRouter();
  const { title, description } = summaryCopy(reason, correct, total, campaignLevelAtStart);
  const passed = reason === "won";

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 rounded-2xl border border-white/10 bg-[#121820]/95 p-6 text-center shadow-2xl shadow-black/40 backdrop-blur-md lg:max-w-xl lg:p-8">
      <div
        className={
          passed
            ? "mx-auto flex size-16 items-center justify-center rounded-full bg-primary/15 text-2xl"
            : "mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10 text-2xl"
        }
      >
        {passed ? "✓" : "✗"}
      </div>
      <div>
        <p className="text-4xl font-bold tabular-nums text-foreground">
          {correct}/{total}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {Math.round((correct / Math.max(total, 1)) * 100)}% accuracy · need 80% to pass
        </p>
      </div>
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col gap-2">
        {showPaywallPrompt && passed ? (
          <Button onClick={onOpenPaywall}>Unlock proctored round · ₹999</Button>
        ) : null}
        <Button variant={passed ? "outline" : "default"} onClick={() => router.push("/home")}>
          Back to Home
        </Button>
        {!passed && reason !== "quit" ? (
          <Button variant="ghost" onClick={() => router.push("/levels")}>
            View level map
          </Button>
        ) : null}
      </div>
    </div>
  );
}
