import { istDateKey } from "@/lib/challenge/ist-day";
import { defaultEduDecaProgress } from "@/lib/progress/defaults";
import { normalizeSubjectLevels } from "@/lib/progress/compute";
import type { EduDecaProgress, EduDecaProgressRow } from "@/lib/progress/types";

export function rowToProgress(row: EduDecaProgressRow | null | undefined): EduDecaProgress {
  if (!row) return defaultEduDecaProgress();

  const campaignLevel = Math.min(10, Math.max(1, row.campaign_level ?? 1));
  const lastChallengeDate = row.last_challenge_date
    ? String(row.last_challenge_date).slice(0, 10)
    : null;
  const today = istDateKey();

  return {
    campaignLevel,
    xp: Math.max(0, row.xp ?? 0),
    streakDays: Math.max(0, row.streak_days ?? 1),
    subjectLevels: normalizeSubjectLevels(row.subject_levels, campaignLevel),
    isProctoredPaid: Boolean(row.is_proctored_paid),
    freeZoneComplete: Boolean(row.free_zone_complete),
    lastChallengeDate,
    todayCompleted: lastChallengeDate === today,
    antiCaptureEnabled: row.anti_capture_enabled !== false,
  };
}

export function progressToRow(userId: string, progress: EduDecaProgress) {
  return {
    user_id: userId,
    campaign_level: progress.campaignLevel,
    xp: progress.xp,
    streak_days: progress.streakDays,
    subject_levels: progress.subjectLevels,
    is_proctored_paid: progress.isProctoredPaid,
    free_zone_complete: progress.freeZoneComplete,
    last_challenge_date: progress.lastChallengeDate,
    anti_capture_enabled: progress.antiCaptureEnabled,
  };
}
