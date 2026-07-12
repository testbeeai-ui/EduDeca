export const CHALLENGE_SPEC = {
  questionCount: 10,
  minCorrect: 8,
  maxStrikes: 3,
  sessionMinutes: 5,
  readPhaseSec: 20,
  optionsPhaseSec: 10,
} as const;

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
