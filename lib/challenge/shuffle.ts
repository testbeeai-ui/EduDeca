import type { ChallengeQuestion } from "@/lib/types";

function shuffleIndices(length: number, seed: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  let s = seed;
  for (let i = indices.length - 1; i > 0; i -= 1) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

export function shuffleChallengeOptions(
  question: ChallengeQuestion,
  seed = Date.now()
): ChallengeQuestion {
  const order = shuffleIndices(question.options.length, seed);
  const shuffledOptions = order.map((i) => question.options[i]);
  const newCorrectIndex = order.indexOf(question.correctIndex);
  return {
    ...question,
    options: shuffledOptions,
    correctIndex: newCorrectIndex,
  };
}
