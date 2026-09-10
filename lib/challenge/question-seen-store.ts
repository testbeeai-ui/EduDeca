import type { SupabaseClient } from "@supabase/supabase-js";

import type { SeenInsert } from "@/lib/challenge/question-seen";

export async function listSeenQuestionIds(
  supabase: SupabaseClient,
  userId: string,
  level: number,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("edudeca_question_seen")
    .select("question_id")
    .eq("user_id", userId)
    .eq("level", level);

  if (error) {
    console.error("[question-seen] list", error);
    throw error;
  }

  const ids = new Set<string>();
  for (const row of data ?? []) {
    if (typeof row.question_id === "string") ids.add(row.question_id);
  }
  return ids;
}

export async function insertSeenRows(
  supabase: SupabaseClient,
  userId: string,
  rows: SeenInsert[],
): Promise<void> {
  if (rows.length === 0) return;

  const { error } = await supabase.from("edudeca_question_seen").upsert(
    rows.map((row) => ({
      user_id: userId,
      question_id: row.questionId,
      level: row.level,
      discipline_id: row.disciplineId,
      outcome: row.outcome,
    })),
    { onConflict: "user_id,question_id", ignoreDuplicates: true },
  );

  if (error) {
    console.error("[question-seen] insert", error);
    throw error;
  }
}
