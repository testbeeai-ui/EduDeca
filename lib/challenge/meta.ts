export const RESULT_FLASH_MS = 1000;

export function remainingOptionsReviewMs(
  secondsLeft: number,
  optionsPhaseSec: number,
  minSec = 1
): number {
  const left = Math.max(minSec, Math.min(Math.ceil(secondsLeft), optionsPhaseSec));
  return left * 1000;
}

export function formatEduBlastClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function difficultyRatingToLabel(rating: number): string {
  if (rating <= 2) return "Easy";
  if (rating <= 4) return "Medium";
  return "Hard";
}

export type EduBlastDotState = "pending" | "current" | "correct" | "wrong" | "skip";

export function buildEduBlastDotStates(
  total: number,
  currentIndex: number,
  outcomes: ("correct" | "wrong" | "skip")[]
): EduBlastDotState[] {
  return Array.from({ length: total }, (_, i) => {
    if (i < outcomes.length) {
      return outcomes[i] === "correct"
        ? "correct"
        : outcomes[i] === "skip"
          ? "skip"
          : "wrong";
    }
    if (i === currentIndex) return "current";
    return "pending";
  });
}

const SUBJECT_LABELS: Record<string, string> = {
  phy: "Physics",
  che: "Chemistry",
  mat: "Mathematics",
  amat: "Applied Mathematics",
  bio: "Biology",
  biotech: "Biotechnology",
  eng: "Verbal Ability",
  cs: "AI & Computer Science",
  ent: "Entrepreneurship",
  eco: "Quantitative Ability",
  fin: "Financial Literacy",
  gk: "General Knowledge",
  log: "Analytical Ability",
};

export function subjectIdToLabel(subjectId: string): string {
  return SUBJECT_LABELS[subjectId] ?? subjectId.toUpperCase();
}
