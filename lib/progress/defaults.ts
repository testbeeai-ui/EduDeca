import { subjects } from "@/data/subjects";
import type { SubjectLevels } from "@/lib/types";
import type { EduDecaProgress } from "@/lib/progress/types";

export function defaultSubjectLevels(floor = 1): SubjectLevels {
  return Object.fromEntries(subjects.map((s) => [s.id, floor]));
}

export function defaultEduDecaProgress(): EduDecaProgress {
  return {
    campaignLevel: 1,
    xp: 0,
    streakDays: 1,
    subjectLevels: defaultSubjectLevels(1),
    isProctoredPaid: false,
    freeZoneComplete: false,
    lastChallengeDate: null,
    todayCompleted: false,
    antiCaptureEnabled: true,
  };
}

export function floorSubjectLevels(
  levels: SubjectLevels,
  campaignLevel: number,
): SubjectLevels {
  const next = { ...levels };
  for (const subjectId of Object.keys(next)) {
    next[subjectId] = Math.min(10, Math.max(next[subjectId] ?? 1, campaignLevel));
  }
  return next;
}
