export const CHALLENGE_SPEC = {
  questionCount: 10,
  /**
   * @deprecated Pass/fail is strike-based via `challengeMaxStrikes(level)`.
   * Kept only for older summary copy fallbacks.
   */
  minCorrect: 8,
  /** Default / Level 3+ strike limit. Prefer `challengeMaxStrikes(level)`. */
  maxStrikes: 3,
  sessionMinutes: 5,
  readPhaseSec: 0,
  optionsPhaseSec: 60,
} as const;

/**
 * Free-zone strike limit (wrong + unanswered).
 * Hitting this count ends the run as a fail immediately.
 * Finish the set with fewer strikes → pass.
 * Level 1: 5 · Level 2: 7 · Level 3+: 10
 */
export function challengeMaxStrikes(campaignLevel: number): number {
  const level = Math.max(1, Math.floor(campaignLevel) || 1);
  if (level <= 1) return 5;
  if (level === 2) return 7;
  return 10;
}

export function challengeQuestionCount(campaignLevel: number): number {
  const level = Math.max(1, Math.floor(campaignLevel) || 1);
  if (level <= 1) return 10;
  if (level === 2) return 20;
  return 30;
}

export function challengeGroupsPerDiscipline(campaignLevel: number): number {
  const level = Math.max(1, Math.floor(campaignLevel) || 1);
  if (level <= 1) return 1;
  if (level === 2) return 2;
  return 3;
}

/** How many wrong/skips you can take and still pass (= strike allowance). */
export function challengeAllowedMisses(campaignLevel: number): number {
  return challengeMaxStrikes(campaignLevel);
}

/**
 * Whole-level session clock (one timer for the run, not per card):
 * Level 1: 5 minutes
 * Level 2: 10 minutes
 * Level 3+: 20 minutes
 */
export function challengeSessionDurationSec(campaignLevel: number = 1): number {
  const level = Math.max(1, Math.floor(campaignLevel) || 1);
  if (level <= 1) return 5 * 60;
  if (level === 2) return 10 * 60;
  return 20 * 60;
}

/** @deprecated Per-card clocks are unused. The run uses `challengeSessionDurationSec`. */
export function challengePerQuestionTotalSec(campaignLevel: number = 1): number {
  return Math.floor(
    challengeSessionDurationSec(campaignLevel) / challengeQuestionCount(campaignLevel),
  );
}

export function formatChallengeClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

