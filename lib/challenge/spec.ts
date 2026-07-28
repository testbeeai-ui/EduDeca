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
  readPhaseSec: 45,
  optionsPhaseSec: 15,
} as const;

/**
 * Free-zone strike budget (wrong + unanswered).
 * Stay under this many strikes and finish the set → pass.
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

export function challengeSessionDurationSec(): number {
  return CHALLENGE_SPEC.sessionMinutes * 60;
}

export function challengePerQuestionTotalSec(): number {
  return CHALLENGE_SPEC.readPhaseSec + CHALLENGE_SPEC.optionsPhaseSec;
}

export function formatChallengeClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
