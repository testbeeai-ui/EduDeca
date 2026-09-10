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
    antiCaptureEnabled: false,
    disciplines: null,
  };
}

/**
 * Discipline badges follow the campaign level. Daily Challenge is one shared
 * level across the 10-discipline lineup — per-subject levels must not drift.
 */
export function floorSubjectLevels(
  _levels: SubjectLevels,
  campaignLevel: number,
): SubjectLevels {
  const floor = Math.min(10, Math.max(1, Math.floor(campaignLevel) || 1));
  return defaultSubjectLevels(floor);
}
