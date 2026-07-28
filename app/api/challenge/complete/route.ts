import { NextRequest, NextResponse } from "next/server";

import { istDateKey } from "@/lib/challenge/ist-day";
import { applyChallengeProgress } from "@/lib/progress/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { ChallengeCompletePayload, ChallengeSummaryReason } from "@/lib/types";

const REASONS: ChallengeSummaryReason[] = [
  "won",
  "strikes",
  "time",
  "below_threshold",
  "quit",
];

function isReason(value: unknown): value is ChallengeSummaryReason {
  return typeof value === "string" && (REASONS as string[]).includes(value);
}

/**
 * One write: persist today's attempt + update campaign progress for signed-in users.
 * Guests still complete locally — this endpoint no-ops without a session.
 */
export async function POST(request: NextRequest) {
  let body: ChallengeCompletePayload & { strikes?: number };
  try {
    body = (await request.json()) as ChallengeCompletePayload & { strikes?: number };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isReason(body.reason)) {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }
  if (body.reason === "quit") {
    return NextResponse.json({ saved: false, skipped: "quit" });
  }

  const level = Number(body.campaignLevelAtStart);
  if (!Number.isInteger(level) || level < 1 || level > 10) {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 });
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ saved: false, skipped: "guest" });
  }

  const strikes =
    typeof body.strikes === "number"
      ? body.strikes
      : (body.results ?? []).filter((r) => !r.isCorrect).length;

  const { error: attemptError } = await supabase.from("edudeca_daily_attempts").upsert(
    {
      user_id: user.id,
      challenge_date: istDateKey(),
      level: Math.min(level, 3),
      results: body.results ?? [],
      correct_count: body.correct ?? 0,
      strikes,
      won: body.reason === "won",
      reason: body.reason,
    },
    { onConflict: "user_id,challenge_date,level" },
  );

  if (attemptError) {
    console.error("[challenge/complete] attempt", attemptError);
    return NextResponse.json({ error: "Failed to save attempt" }, { status: 500 });
  }

  try {
    const progress = await applyChallengeProgress(supabase, user, body);
    return NextResponse.json({ saved: true, progress });
  } catch (err) {
    console.error("[challenge/complete] progress", err);
    // Attempt already saved — still return success with a soft progress warning.
    return NextResponse.json({ saved: true, progressError: true });
  }
}
