import type { SupabaseClient } from "@supabase/supabase-js";

import type { ChallengeSummaryReason } from "@/lib/types";

const FAIL_OUTCOMES = ["strikes", "time", "below_threshold"] as const;

export async function countLevelFailTrials(
  supabase: SupabaseClient,
  userId: string,
  level: number,
): Promise<number> {
  const { count, error } = await supabase
    .from("edudeca_level_trials")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("level", level)
    .in("outcome", [...FAIL_OUTCOMES]);

  if (error) {
    console.error("[trials] count", error);
    throw error;
  }
  return count ?? 0;
}

export async function firstLevelTrialCreatedAt(
  supabase: SupabaseClient,
  userId: string,
  level: number,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("edudeca_level_trials")
    .select("created_at")
    .eq("user_id", userId)
    .eq("level", level)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[trials] first", error);
    throw error;
  }
  return typeof data?.created_at === "string" ? data.created_at : null;
}

export async function insertLevelTrial(
  supabase: SupabaseClient,
  userId: string,
  level: number,
  outcome: Exclude<ChallengeSummaryReason, "quit">,
): Promise<void> {
  const { error } = await supabase.from("edudeca_level_trials").insert({
    user_id: userId,
    level,
    outcome,
  });
  if (error) {
    console.error("[trials] insert", error);
    throw error;
  }
}
