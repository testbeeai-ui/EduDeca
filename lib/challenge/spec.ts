export const CHALLENGE_SPEC = {
  questionCount: 10,
  /**
   * @deprecated Pass/fail is strike-based via `challengeMaxStrikes(level)`.
   * Kept only for older summary copy fallbacks.
   */
  minCorrect: 8,
  /** Default / Level 3+ strike limit. Prefer `challengeMaxStrikes(level)`. */
  maxStrikes: 3,
  sessionMinutes: 10,
  readPhaseSec: 0,
  optionsPhaseSec: 60,
} as const;

/**
 * Free-zone strike limit (wrong + unanswered).
 * Hitting this count ends the run as a fail immediately (e.g. 5/5 on L1).
 * Finish the set with fewer strikes → pass.
 * Level 1: 5 · Level 2: 4 · Level 3+: 3
 */
export function challengeMaxStrikes(campaignLevel: number): number {
  const level = Math.max(1, Math.floor(campaignLevel) || 1);
  if (level <= 1) return 5;
  if (level === 2) return 4;
  return 3;
}

/** How many wrong/skips you can take and still pass (= strike allowance). */
export function challengeAllowedMisses(campaignLevel: number): number {
  return challengeMaxStrikes(campaignLevel);
}

/**
 * Total exam session duration in seconds per level:
 * Level 1: 5 minutes (300s)
 * Level 2: 7 minutes (420s)
 * Level 3+: 10 minutes (600s)
 */
export function challengeSessionDurationSec(campaignLevel: number = 1): number {
  const level = Math.max(1, Math.floor(campaignLevel) || 1);
  if (level <= 1) return 5 * 60; // 5 minutes
  if (level === 2) return 7 * 60; // 7 minutes
  return 10 * 60; // 10 minutes
}

export function challengePerQuestionTotalSec(): number {
  return CHALLENGE_SPEC.optionsPhaseSec;
}

export function formatChallengeClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

