import { NextRequest, NextResponse } from "next/server";

import { isTesterInvestorEmail } from "@/lib/admin/tester-allowlist";
import { istDateKey } from "@/lib/challenge/ist-day";
import { seenInsertsFromRun } from "@/lib/challenge/question-seen";
import { insertSeenRows } from "@/lib/challenge/question-seen-store";
import { countLevelFailTrials, insertLevelTrial } from "@/lib/challenge/trial-store";
import {
  gateStudentLevelAccess,
  trialGateMessage,
  trialsSnapshotFromFailCount,
  type LevelTrialsSnapshot,
} from "@/lib/challenge/trials";
import { applyChallengeProgress, getOrCreateProgress } from "@/lib/progress/server";
import { requireApiUser } from "@/lib/supabase/require-user";
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

  const level = Number(body.campaignLevelAtStart);
  if (!Number.isInteger(level) || level < 1 || level > 10) {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 });
  }

  const auth = await requireApiUser();
  if (!auth) {
    return NextResponse.json({ saved: false, skipped: "guest" });
  }
  const { supabase, user } = auth;

  const unlimited = isTesterInvestorEmail(user.email);
  const current = await getOrCreateProgress(supabase, user);
  const failCount = await countLevelFailTrials(supabase, user.id, level);
  const gate = gateStudentLevelAccess({
    requestedLevel: level,
    campaignLevel: current.campaignLevel,
    todayCompleted: current.todayCompleted,
    failCount,
    unlimited,
  });
  if (gate !== "ok") {
    return NextResponse.json(trialGateMessage(gate), { status: 403 });
  }

  const seenRows = seenInsertsFromRun({
    level,
    reason: body.reason,
    results: (body.results ?? []).map((row) => ({
      questionId: row.questionId,
      disciplineId: row.subjectId,
      isCorrect: row.isCorrect,
      skipped: row.skipped === true,
    })),
  });
  try {
    await insertSeenRows(supabase, user.id, seenRows);
  } catch (err) {
    console.error("[challenge/complete] seen", err);
    return NextResponse.json({ error: "Failed to save attempt" }, { status: 500 });
  }

  if (body.reason === "quit") {
    return NextResponse.json({ saved: true, seen: true, skipped: "quit" });
  }

  try {
    await insertLevelTrial(supabase, user.id, level, body.reason);
  } catch (err) {
    console.error("[challenge/complete] trial", err);
    return NextResponse.json({ error: "Failed to save attempt" }, { status: 500 });
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

  let trials: LevelTrialsSnapshot | null = null;
  try {
    const failCountAfter = await countLevelFailTrials(supabase, user.id, level);
    trials = trialsSnapshotFromFailCount({
      failCount: failCountAfter,
      unlimited,
      requestedLevel: level,
      campaignLevel: current.campaignLevel,
      todayCompleted: body.reason === "won" ? true : current.todayCompleted,
    });
  } catch (err) {
    console.error("[challenge/complete] trials snapshot", err);
  }

  try {
    const progress = await applyChallengeProgress(supabase, user, body);
    return NextResponse.json({ saved: true, progress, trials });
  } catch (err) {
    console.error("[challenge/complete] progress", err);
    // Attempt already saved — still return success with a soft progress warning.
    return NextResponse.json({ saved: true, progressError: true, trials });
  }
}
