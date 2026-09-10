import { istDateKey } from "@/lib/challenge/ist-day";
import {
  defaultSubjectLevels,
  floorSubjectLevels,
} from "@/lib/progress/defaults";
import type { EduDecaProgress } from "@/lib/progress/types";
import type { ChallengeCompletePayload, SubjectLevels } from "@/lib/types";

/** Yesterday's calendar date in IST as YYYY-MM-DD. */
export function istYesterdayKey(now = new Date()): string {
  const today = istDateKey(now);
  const [y, m, d] = today.split("-").map(Number);
  const utcNoon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  utcNoon.setUTCDate(utcNoon.getUTCDate() - 1);
  return istDateKey(utcNoon);
}

export function normalizeSubjectLevels(
  raw: SubjectLevels | Record<string, number> | null | undefined,
  campaignLevel = 1,
): SubjectLevels {
  const base = defaultSubjectLevels(1);
  if (raw && typeof raw === "object") {
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        base[key] = Math.min(10, Math.max(1, Math.floor(value)));
      }
    }
  }
  return floorSubjectLevels(base, campaignLevel);
}

/** Win on today's IST date locks the daily challenge until tomorrow (IST).
 * Admins can clear this via Skip wait. */
export function withTodayLock(progress: EduDecaProgress, today = istDateKey()): EduDecaProgress {
  return {
    ...progress,
    subjectLevels: normalizeSubjectLevels(progress.subjectLevels, progress.campaignLevel),
    todayCompleted: progress.lastChallengeDate === today,
  };
}

export function applyChallengeToProgress(
  state: EduDecaProgress,
  payload: ChallengeCompletePayload,
  today = istDateKey(),
): EduDecaProgress {
  if (payload.reason === "quit") {
    return state;
  }

  const xpGain = payload.correct * 10;
  let nextSubjectLevels = normalizeSubjectLevels(
    state.subjectLevels,
    state.campaignLevel,
  );

  let nextStreak = state.streakDays;
  let nextCampaignLevel = state.campaignLevel;
  let nextFreeZoneComplete = state.freeZoneComplete;
  let nextLastChallengeDate = state.lastChallengeDate;
  let nextTodayCompleted = state.lastChallengeDate === today;

  if (payload.reason === "won") {
    if (state.lastChallengeDate !== today) {
      nextStreak =
        state.lastChallengeDate === istYesterdayKey() ? state.streakDays + 1 : 1;
    }
    nextLastChallengeDate = today;
    // Lock until tomorrow (IST). Next level is unlocked but not playable yet —
    // except admins via Skip wait.
    nextTodayCompleted = true;
    if (state.campaignLevel < 3) {
      nextCampaignLevel = state.campaignLevel + 1;
    } else if (state.campaignLevel === 3) {
      nextFreeZoneComplete = true;
    } else if (state.isProctoredPaid && state.campaignLevel < 10) {
      nextCampaignLevel = state.campaignLevel + 1;
    }
    nextSubjectLevels = floorSubjectLevels(nextSubjectLevels, nextCampaignLevel);
  }


  return {
    ...state,
    xp: state.xp + xpGain,
    streakDays: nextStreak,
    subjectLevels: nextSubjectLevels,
    campaignLevel: nextCampaignLevel,
    freeZoneComplete: nextFreeZoneComplete,
    todayCompleted: nextTodayCompleted,
    lastChallengeDate: nextLastChallengeDate,
  };
}

export function skipDailyWaitProgress(state: EduDecaProgress): EduDecaProgress {
  return {
    ...state,
    todayCompleted: false,
    lastChallengeDate: null,
  };
}

export function jumpCampaignProgress(
  state: EduDecaProgress,
  level: 1 | 2 | 3,
): EduDecaProgress {
  const nextLevel = Math.min(3, Math.max(1, level)) as 1 | 2 | 3;
  return {
    ...state,
    campaignLevel: nextLevel,
    freeZoneComplete: nextLevel >= 3 ? state.freeZoneComplete : false,
    subjectLevels: floorSubjectLevels(
      normalizeSubjectLevels(state.subjectLevels, nextLevel),
      nextLevel,
    ),
    todayCompleted: false,
    lastChallengeDate: null,
  };
}
