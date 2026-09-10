import type { ChallengeQuestion } from "../types";
import { istDateKey } from "./ist-day";
import { shuffleWithSeed } from "./shuffle";

export const LEVEL1_SET_COUNT = 20;
export const LEVEL1_BANK_SIZE = 12;
export const LEVEL1_SESSION_SEC = 12 * 60;
export const LEVEL1_PER_QUESTION_SEC = 45;

/** FNV-1a → uint32, stable across runtimes. */
export function hashSeed(key: string): number {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** IST calendar day as a UTC epoch-day integer. */
function istEpochDay(istKey: string): number {
  const [year, month, day] = istKey.split("-").map(Number);
  return Math.floor(Date.UTC(year, (month ?? 1) - 1, day ?? 1) / 86_400_000);
}

/**
 * New players always start on set 1 (not the shared calendar slot).
 * Later IST days since their first L1 attempt advance 1–20. Same-day retries stay on the same set.
 */
export function level1SetNumberForUser(
  firstPlayedIstKey: string | null,
  now = new Date(),
): number {
  if (!firstPlayedIstKey) return 1;
  const elapsed = Math.max(0, istEpochDay(istDateKey(now)) - istEpochDay(firstPlayedIstKey));
  return (elapsed % LEVEL1_SET_COUNT) + 1;
}

/** @deprecated Calendar-wide set. Prefer `level1SetNumberForUser` so first players stay on set 1. */
export function level1SetNumber(now = new Date()): number {
  return (istEpochDay(istDateKey(now)) % LEVEL1_SET_COUNT) + 1;
}

export function jumbleSeed(userId: string, setNumber: number): number {
  return hashSeed(`${userId}|set-${setNumber}`);
}

type BuildArgs = {
  lineupIds: string[];
  userId: string;
  setNumber: number;
};

/**
 * Same 12-subject set for a given player-day; each student sees only their
 * 10 selected disciplines, jumbled per user so Q1 is not the same for everyone.
 */
export function buildLevel1Attempt(
  bank: ChallengeQuestion[],
  args: BuildArgs,
): ChallengeQuestion[] {
  const wanted = new Set(args.lineupIds);
  const filtered = bank.filter((row) => wanted.has(row.subjectId));
  return shuffleWithSeed(filtered, jumbleSeed(args.userId, args.setNumber));
}
