import { NextRequest, NextResponse } from "next/server";

import { shuffleChallengeOptions } from "@/lib/challenge/shuffle";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { ChallengeQuestion } from "@/lib/types";

const SUBJECT_ORDER = [
  "phy",
  "che",
  "mat",
  "bio",
  "eng",
  "cs",
  "eco",
  "fin",
  "gk",
  "log",
] as const;

type QuestionRow = {
  id: string;
  subject_id: string;
  stem: string;
  options: string[] | unknown;
  correct_index: number;
  explanation: string | null;
  difficulty_rating: number | null;
  level: number;
  sort_order: number;
};

function parseLevel(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 10) return null;
  return n;
}

function todaySeed(level: number): number {
  const key = `${new Date().toISOString().slice(0, 10)}|${level}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * One call: fetch all published questions for a campaign level (1–3 today).
 * Options are shuffled server-side with a stable daily seed.
 */
export async function GET(request: NextRequest) {
  const level = parseLevel(request.nextUrl.searchParams.get("level"));
  if (level == null) {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 });
  }

  // Free-zone packs are levels 1–3 until later packs are seeded.
  const questionLevel = Math.min(level, 3);

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("edudeca_questions")
    .select(
      "id, subject_id, stem, options, correct_index, explanation, difficulty_rating, level, sort_order",
    )
    .eq("level", questionLevel)
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[challenge/questions]", error);
    return NextResponse.json({ error: "Failed to load questions" }, { status: 500 });
  }

  const rows = (data ?? []) as QuestionRow[];
  if (rows.length === 0) {
    return NextResponse.json(
      { error: `No questions published for level ${questionLevel}` },
      { status: 404 },
    );
  }

  const bySubject = new Map<string, QuestionRow>();
  for (const row of rows) {
    bySubject.set(row.subject_id, row);
  }

  const seed = todaySeed(questionLevel);
  const questions: ChallengeQuestion[] = [];

  SUBJECT_ORDER.forEach((subjectId, idx) => {
    const row = bySubject.get(subjectId);
    if (!row) return;
    const options = Array.isArray(row.options)
      ? row.options.map(String)
      : (JSON.parse(String(row.options)) as string[]);

    const base: ChallengeQuestion = {
      id: row.id,
      subjectId: row.subject_id,
      stem: row.stem,
      options,
      correctIndex: row.correct_index,
      explanation: row.explanation ?? undefined,
      difficultyRating: row.difficulty_rating ?? questionLevel,
    };
    questions.push(shuffleChallengeOptions(base, seed + idx * 31));
  });

  if (questions.length !== 10) {
    return NextResponse.json(
      {
        error: `Expected 10 subjects, got ${questions.length}`,
        missing: SUBJECT_ORDER.filter((id) => !bySubject.has(id)),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    level: questionLevel,
    campaignLevel: level,
    questions,
  });
}
