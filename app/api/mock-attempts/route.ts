import { NextRequest, NextResponse } from "next/server";

import {
  buildAttemptUpserts,
  progressFromAttemptRows,
  type AttemptRow,
} from "@/lib/mock-test/attempt-sync";
import { parseProgressRaw, type MockProgressState } from "@/lib/mock-test/progress-store";
import { requireApiUser } from "@/lib/supabase/require-user";

async function loadAttemptRows(
  supabase: Awaited<NonNullable<Awaited<ReturnType<typeof requireApiUser>>>["supabase"]>,
  userId: string,
): Promise<AttemptRow[]> {
  const { data, error } = await supabase
    .from("edudeca_mock_attempts")
    .select("level, set_number, status, score_pct, correct, total, answers, updated_at")
    .eq("user_id", userId);
  if (error) {
    console.error("[api/mock-attempts] load", error);
    throw error;
  }
  return (data as AttemptRow[] | null) ?? [];
}

export async function GET() {
  const auth = await requireApiUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const rows = await loadAttemptRows(auth.supabase, auth.user.id);
    return NextResponse.json({ progress: progressFromAttemptRows(rows) });
  } catch {
    return NextResponse.json({ error: "Failed to load attempts" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  let body: { progress?: unknown };
  try {
    body = (await request.json()) as { progress?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const incoming = parseProgressRaw(
    typeof body.progress === "string" ? body.progress : JSON.stringify(body.progress ?? null),
  );

  const auth = await requireApiUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await loadAttemptRows(auth.supabase, auth.user.id);
    await persistProgress(auth.supabase, auth.user.id, existing, incoming);
    const saved = progressFromAttemptRows(await loadAttemptRows(auth.supabase, auth.user.id));
    return NextResponse.json({ progress: saved });
  } catch (err) {
    console.error("[api/mock-attempts PUT]", err);
    return NextResponse.json({ error: "Failed to save attempts" }, { status: 500 });
  }
}

async function persistProgress(
  supabase: Awaited<NonNullable<Awaited<ReturnType<typeof requireApiUser>>>["supabase"]>,
  userId: string,
  existing: AttemptRow[],
  incoming: MockProgressState,
) {
  for (const write of buildAttemptUpserts(existing, incoming)) {
    const payload: Record<string, unknown> = {
      user_id: userId,
      level: write.level,
      set_number: write.set_number,
      status: write.status,
      score_pct: write.score_pct,
      correct: write.correct,
      total: write.total,
    };
    if (write.answers !== undefined) payload.answers = write.answers;
    const { error } = await supabase
      .from("edudeca_mock_attempts")
      .upsert(payload, { onConflict: "user_id,level,set_number" });
    if (error) throw error;
  }
}
