import { NextRequest, NextResponse } from "next/server";

import { shuffleChallengeOptions } from "@/lib/challenge/shuffle";
import { LINEUP_SIZE, type DisciplineId } from "@/data/disciplines";
import { isLineupComplete, validateLineup } from "@/lib/disciplines/selection";
import { getOrCreateProgress } from "@/lib/progress/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { ChallengeQuestion } from "@/lib/types";

const ALL_SUBJECTS: DisciplineId[] = [
  "phy",
  "che",
  "mat",
  "amat",
  "bio",
  "biotech",
  "cs",
  "ent",
  "eng",
  "eco",
  "log",
  "gk",
  "fin",
];

const FALLBACK_LINEUP: DisciplineId[] = [
  "phy",
  "che",
  "mat",
  "amat",
  "cs",
  "eng",
  "eco",
  "log",
  "gk",
  "fin",
];

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

function parseDisciplinesParam(raw: string | null): DisciplineId[] | null {
  if (!raw) return null;
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const lineup = validateLineup(ids);
  if (!lineup || !isLineupComplete(lineup)) return null;
  return ids as DisciplineId[];
}

function todaySeed(level: number, subjectsKey: string): number {
  const key = `${new Date().toISOString().slice(0, 10)}|${level}|${subjectsKey}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * One call: fetch one MCQ per selected Decathlon discipline for the campaign level.
 * Subject order follows the student's lineup (10 of 13 disciplines).
 */
export async function GET(request: NextRequest) {
  const level = parseLevel(request.nextUrl.searchParams.get("level"));
  if (level == null) {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 });
  }

  const questionLevel = Math.min(level, 3);
  const supabase = await createSupabaseServer();

  let subjectOrder = parseDisciplinesParam(request.nextUrl.searchParams.get("disciplines"));

  if (!subjectOrder) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      try {
        const progress = await getOrCreateProgress(supabase, user);
        const fromDb = progress.disciplines ? validateLineup(progress.disciplines) : null;
        if (fromDb && isLineupComplete(fromDb)) {
          subjectOrder = progress.disciplines as DisciplineId[];
        }
      } catch (err) {
        console.warn("[challenge/questions] progress lookup", err);
      }
    }
  }

  if (!subjectOrder || subjectOrder.length !== LINEUP_SIZE) {
    subjectOrder = FALLBACK_LINEUP;
  }

  // Guard: only known discipline ids
  const allowed = new Set(ALL_SUBJECTS);
  if (subjectOrder.some((id) => !allowed.has(id))) {
    return NextResponse.json({ error: "Invalid disciplines" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("edudeca_questions")
    .select(
      "id, subject_id, stem, options, correct_index, explanation, difficulty_rating, level, sort_order",
    )
    .eq("level", questionLevel)
    .eq("published", true)
    .in("subject_id", subjectOrder)
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

  const seed = todaySeed(questionLevel, subjectOrder.join(","));
  const questions: ChallengeQuestion[] = [];
  const missing: string[] = [];

  subjectOrder.forEach((subjectId, idx) => {
    const row = bySubject.get(subjectId);
    if (!row) {
      missing.push(subjectId);
      return;
    }
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

  if (questions.length !== LINEUP_SIZE) {
    return NextResponse.json(
      {
        error: `Expected ${LINEUP_SIZE} subjects, got ${questions.length}`,
        missing,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    level: questionLevel,
    campaignLevel: level,
    disciplines: subjectOrder,
    questions,
  });
}
