import type { SubjectLevels } from "@/lib/types";

/** Client/server progress snapshot for EduDeca. */
export interface EduDecaProgress {
  campaignLevel: number;
  xp: number;
  streakDays: number;
  subjectLevels: SubjectLevels;
  isProctoredPaid: boolean;
  freeZoneComplete: boolean;
  lastChallengeDate: string | null;
  todayCompleted: boolean;
  antiCaptureEnabled: boolean;
  /** Ordered 10-slot Decathlon lineup (discipline ids). */
  disciplines?: string[] | null;
}

export interface EduDecaProgressRow {
  user_id: string;
  campaign_level: number;
  xp: number;
  streak_days: number;
  subject_levels: SubjectLevels | Record<string, number> | null;
  is_proctored_paid: boolean;
  free_zone_complete: boolean;
  last_challenge_date: string | null;
  anti_capture_enabled: boolean;
  disciplines?: string[] | null;
}
