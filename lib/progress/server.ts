import type { SupabaseClient, User } from "@supabase/supabase-js";

import { isTesterInvestorEmail } from "@/lib/admin/tester-allowlist";
import {
  applyChallengeToProgress,
  jumpCampaignProgress,
  skipDailyWaitProgress,
} from "@/lib/progress/compute";
import { defaultEduDecaProgress } from "@/lib/progress/defaults";
import { progressToRow, rowToProgress } from "@/lib/progress/map";
import type { EduDecaProgress, EduDecaProgressRow } from "@/lib/progress/types";
import type { ChallengeCompletePayload } from "@/lib/types";

async function fetchProgressRow(
  supabase: SupabaseClient,
  userId: string,
): Promise<EduDecaProgressRow | null> {
  const { data, error } = await supabase
    .from("edudeca_user_progress")
    .select(
      "user_id, campaign_level, xp, streak_days, subject_levels, is_proctored_paid, free_zone_complete, last_challenge_date, anti_capture_enabled",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[progress] fetch", error);
    throw error;
  }
  return (data as EduDecaProgressRow | null) ?? null;
}

export async function getOrCreateProgress(
  supabase: SupabaseClient,
  user: User,
): Promise<EduDecaProgress> {
  const existing = await fetchProgressRow(supabase, user.id);
  if (existing) return rowToProgress(existing);

  const seed = defaultEduDecaProgress();
  const { data, error } = await supabase
    .from("edudeca_user_progress")
    .upsert(progressToRow(user.id, seed), { onConflict: "user_id" })
    .select(
      "user_id, campaign_level, xp, streak_days, subject_levels, is_proctored_paid, free_zone_complete, last_challenge_date, anti_capture_enabled",
    )
    .single();

  if (error) {
    console.error("[progress] create", error);
    throw error;
  }
  return rowToProgress(data as EduDecaProgressRow);
}

export async function saveProgress(
  supabase: SupabaseClient,
  userId: string,
  progress: EduDecaProgress,
): Promise<EduDecaProgress> {
  const { data, error } = await supabase
    .from("edudeca_user_progress")
    .upsert(progressToRow(userId, progress), { onConflict: "user_id" })
    .select(
      "user_id, campaign_level, xp, streak_days, subject_levels, is_proctored_paid, free_zone_complete, last_challenge_date, anti_capture_enabled",
    )
    .single();

  if (error) {
    console.error("[progress] save", error);
    throw error;
  }
  return rowToProgress(data as EduDecaProgressRow);
}

export async function applyChallengeProgress(
  supabase: SupabaseClient,
  user: User,
  payload: ChallengeCompletePayload,
): Promise<EduDecaProgress> {
  const current = await getOrCreateProgress(supabase, user);
  const next = applyChallengeToProgress(current, payload);
  return saveProgress(supabase, user.id, next);
}

export function assertTesterUser(user: User): void {
  if (!isTesterInvestorEmail(user.email)) {
    const err = new Error("Forbidden");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
}

export async function adminSkipDailyWait(
  supabase: SupabaseClient,
  user: User,
): Promise<EduDecaProgress> {
  assertTesterUser(user);
  const current = await getOrCreateProgress(supabase, user);
  return saveProgress(supabase, user.id, skipDailyWaitProgress(current));
}

export async function adminJumpCampaignLevel(
  supabase: SupabaseClient,
  user: User,
  level: 1 | 2 | 3,
): Promise<EduDecaProgress> {
  assertTesterUser(user);
  const current = await getOrCreateProgress(supabase, user);
  return saveProgress(supabase, user.id, jumpCampaignProgress(current, level));
}

export async function updateAntiCapture(
  supabase: SupabaseClient,
  user: User,
  enabled: boolean,
): Promise<EduDecaProgress> {
  assertTesterUser(user);
  const current = await getOrCreateProgress(supabase, user);
  return saveProgress(supabase, user.id, {
    ...current,
    antiCaptureEnabled: enabled,
  });
}
