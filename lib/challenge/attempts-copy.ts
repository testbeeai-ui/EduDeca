import type { ChallengeSummaryReason } from "@/lib/types";

import { isFailOutcome } from "./trials";

export const LEVEL_ATTEMPTS_HINT =
  "You have 10 attempts on this level to earn a pass. Clear it within those 10 to keep going.";

export type FailAttemptsPanel = {
  used: number;
  remaining: number | null;
  limit: number;
  exhausted: boolean;
  unlimited: boolean;
  title: string;
  description: string;
  hint: string;
};

export function failAttemptsPanel(args: {
  reason: ChallengeSummaryReason;
  remaining: number | null;
  failCount?: number | null;
  unlimited: boolean;
  limit: number;
}): FailAttemptsPanel | null {
  const limit = args.limit;
  const usedFromCount = Math.min(limit, Math.max(0, args.failCount ?? 0));

  if (args.reason === "quit") {
    if (args.unlimited) {
      return {
        used: usedFromCount,
        remaining: null,
        limit,
        exhausted: false,
        unlimited: true,
        title: "Level attempts",
        description: "Leaving mid-round does not use an attempt. You can still retry.",
        hint: LEVEL_ATTEMPTS_HINT,
      };
    }
    if (args.remaining == null) return null;
    const remaining = Math.max(0, args.remaining);
    const used = Math.min(limit, Math.max(usedFromCount, limit - remaining));
    return {
      used,
      remaining,
      limit,
      exhausted: false,
      unlimited: false,
      title: "Level attempts",
      description: `Leaving mid-round does not use an attempt. You still have ${remaining} of ${limit} on this level.`,
      hint: LEVEL_ATTEMPTS_HINT,
    };
  }

  if (!isFailOutcome(args.reason)) return null;

  if (args.unlimited) {
    const used = Math.min(limit, Math.max(0, args.failCount ?? 0));
    return {
      used,
      remaining: null,
      limit,
      exhausted: false,
      unlimited: true,
      title: "Level attempts",
      description:
        used === 1
          ? "1 fail recorded on this level. You can still retry."
          : `${used} fails recorded on this level. You can still retry.`,
      hint: LEVEL_ATTEMPTS_HINT,
    };
  }

  if (args.remaining == null) return null;
  const remaining = Math.max(0, args.remaining);
  const usedFromRemaining = Math.min(limit, Math.max(0, limit - remaining));
  const used = Math.max(usedFromRemaining, usedFromCount);
  const exhausted = remaining <= 0;
  return {
    used,
    remaining,
    limit,
    exhausted,
    unlimited: false,
    title: "Level attempts",
    description: exhausted
      ? `0 of ${limit} attempts left. You cannot attempt this level again.`
      : `${remaining} of ${limit} attempts left on this level.`,
    hint: LEVEL_ATTEMPTS_HINT,
  };
}

export function failOutcomeHeadline(args: {
  reason: ChallengeSummaryReason;
  exhausted: boolean;
  level: number;
  maxStrikes: number;
  correct: number;
  total: number;
}): { title: string; description: string } | null {
  if (!isFailOutcome(args.reason)) return null;
  if (args.exhausted) {
    return {
      title: "No attempts left",
      description: `You used all 10 attempts on Level ${args.level} without passing. This level is closed for your account.`,
    };
  }
  switch (args.reason) {
    case "strikes":
      return {
        title: `${args.maxStrikes} strikes limit reached`,
        description: `You hit ${args.maxStrikes} wrong or unanswered questions. This run used one of your 10 attempts on this level.`,
      };
    case "time":
      return {
        title: "Time's up",
        description:
          "The session timer ran out before you could finish. This run used one of your 10 attempts on this level.",
      };
    case "below_threshold":
      return {
        title: "Challenge failed",
        description: `Stay under ${args.maxStrikes} strikes and finish all questions to advance. You got ${args.correct}/${args.total}. This run used one of your 10 attempts on this level.`,
      };
    case "won":
    case "quit":
      return null;
    default: {
      const _exhaustive: never = args.reason;
      return { title: String(_exhaustive), description: "" };
    }
  }
}
