import type { ChallengeSummaryReason } from "@/lib/types";

export const STUDENT_TRIALS_PER_LEVEL = 10;

export type TrialGateReason =
  | "ok"
  | "level_passed"
  | "level_locked_ahead"
  | "daily_lock"
  | "trials_exhausted";

export function remainingTrials(failCount: number, unlimited: boolean): number {
  if (unlimited) return Number.POSITIVE_INFINITY;
  return Math.max(0, STUDENT_TRIALS_PER_LEVEL - Math.max(0, failCount));
}

/** JSON-safe remaining count. Testers serialize as null, not Infinity. */
export function remainingTrialsPayload(
  failCount: number,
  unlimited: boolean,
): number | null {
  if (unlimited) return null;
  return remainingTrials(failCount, false);
}

export type LevelTrialsSnapshot = {
  failCount: number;
  remaining: number | null;
  limit: number;
  gate: TrialGateReason;
  unlimited: boolean;
};

export function trialsSnapshotFromFailCount(args: {
  failCount: number;
  unlimited: boolean;
  requestedLevel: number;
  campaignLevel: number;
  todayCompleted: boolean;
}): LevelTrialsSnapshot {
  return {
    failCount: args.failCount,
    remaining: remainingTrialsPayload(args.failCount, args.unlimited),
    limit: STUDENT_TRIALS_PER_LEVEL,
    gate: gateStudentLevelAccess(args),
    unlimited: args.unlimited,
  };
}

export function trialGateMessage(reason: Exclude<TrialGateReason, "ok">): {
  code: string;
  error: string;
} {
  switch (reason) {
    case "level_passed":
      return {
        code: "LEVEL_PASSED",
        error: "You already qualified from this level. You cannot go back.",
      };
    case "level_locked_ahead":
      return {
        code: "LEVEL_LOCKED_AHEAD",
        error: "Pass your current level first.",
      };
    case "daily_lock":
      return {
        code: "DAILY_LOCK",
        error: "You already passed today's round. Come back tomorrow.",
      };
    case "trials_exhausted":
      return {
        code: "TRIALS_EXHAUSTED",
        error: "You have used all 10 attempts on this level.",
      };
    default: {
      const _exhaustive: never = reason;
      return { code: String(_exhaustive), error: "Not allowed" };
    }
  }
}

export function trialGateFromCode(
  code: string | undefined,
): Exclude<TrialGateReason, "ok"> | null {
  switch (code) {
    case "LEVEL_PASSED":
      return "level_passed";
    case "LEVEL_LOCKED_AHEAD":
      return "level_locked_ahead";
    case "DAILY_LOCK":
      return "daily_lock";
    case "TRIALS_EXHAUSTED":
      return "trials_exhausted";
    default:
      return null;
  }
}

export function gateStudentLevelAccess(args: {
  requestedLevel: number;
  campaignLevel: number;
  todayCompleted: boolean;
  failCount: number;
  unlimited: boolean;
}): TrialGateReason {
  if (args.unlimited) return "ok";
  if (args.requestedLevel < args.campaignLevel) return "level_passed";
  if (args.requestedLevel > args.campaignLevel) return "level_locked_ahead";
  if (args.todayCompleted) return "daily_lock";
  if (args.failCount >= STUDENT_TRIALS_PER_LEVEL) return "trials_exhausted";
  return "ok";
}

export function isFailOutcome(reason: ChallengeSummaryReason): boolean {
  switch (reason) {
    case "strikes":
    case "time":
    case "below_threshold":
      return true;
    case "won":
    case "quit":
      return false;
    default: {
      const _exhaustive: never = reason;
      return Boolean(_exhaustive);
    }
  }
}
