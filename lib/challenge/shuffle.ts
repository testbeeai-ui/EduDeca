import type { ChallengeQuestion } from "@/lib/types";

/** Deterministic Fisher–Yates from a numeric seed. */
export function shuffleIndices(length: number, seed: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  let s = seed >>> 0;
  for (let i = indices.length - 1; i > 0; i -= 1) {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    const j = s % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

/** Shuffle any array with a seed (returns a new array). */
export function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const order = shuffleIndices(items.length, seed);
  return order.map((i) => items[i]!);
}

export function shuffleChallengeOptions(
  question: ChallengeQuestion,
  seed = Date.now()
): ChallengeQuestion {
  const order = shuffleIndices(question.options.length, seed);
  const shuffledOptions = order.map((i) => question.options[i]!);
  const newCorrectIndex = order.indexOf(question.correctIndex);
  return {
    ...question,
    options: shuffledOptions,
    correctIndex: newCorrectIndex < 0 ? question.correctIndex : newCorrectIndex,
  };
}

/** Fresh per-attempt seed so each play (incl. streak / skip-wait) reshuffles. */
export function attemptSeed(...parts: Array<string | number>): number {
  const key = `${Date.now()}|${Math.random().toString(36).slice(2)}|${parts.join("|")}`;
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
