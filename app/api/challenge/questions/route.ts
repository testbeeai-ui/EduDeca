import { NextRequest, NextResponse } from "next/server";

import {
  attemptSeed,
  shuffleChallengeOptions,
  shuffleWithSeed,
} from "@/lib/challenge/shuffle";
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

function parseOptions(raw: QuestionRow["options"]): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  return (JSON.parse(String(raw)) as string[]).map(String);
}

/**
 * One MCQ per selected Decathlon discipline for the campaign level.
 * Every attempt reshuffles question order + option order (streak / skip-wait / retry).
 * If a subject has multiple published items at that level, one is picked at random.
 * Never mixes questions from another level into this pack.
 */
export async function GET(request: NextRequest) {
  const level = parseLevel(request.nextUrl.searchParams.get("level"));
  if (level == null) {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 });
  }

  // Free-zone bank is L1–L3 only; never mix another level's questions.
  const questionLevel = Math.min(Math.max(level, 1), 3);
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
    .in("subject_id", subjectOrder);

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

  const bySubject = new Map<string, QuestionRow[]>();
  for (const row of rows) {
    // Strict level guard — never leak another level into this pack.
    if (row.level !== questionLevel) continue;
    const list = bySubject.get(row.subject_id) ?? [];
    list.push(row);
    bySubject.set(row.subject_id, list);
  }

  const seed = attemptSeed(questionLevel, subjectOrder.join(","));
  const picked: ChallengeQuestion[] = [];
  const missing: string[] = [];

  subjectOrder.forEach((subjectId, idx) => {
    const pool = bySubject.get(subjectId) ?? [];
    if (pool.length === 0) {
      missing.push(subjectId);
      return;
    }
    const pickIndex = (seed + idx * 17) % pool.length;
    const row = pool[pickIndex]!;
    const base: ChallengeQuestion = {
      id: row.id,
      subjectId: row.subject_id,
      stem: row.stem,
      options: parseOptions(row.options),
      correctIndex: row.correct_index,
      explanation: row.explanation ?? undefined,
      difficultyRating: row.difficulty_rating ?? questionLevel,
    };
    picked.push(shuffleChallengeOptions(base, seed + idx * 31));
  });

  if (picked.length !== LINEUP_SIZE) {
    return NextResponse.json(
      {
        error: `Expected ${LINEUP_SIZE} subjects, got ${picked.length}`,
        missing,
      },
      { status: 500 },
    );
  }

  // Randomize question order every attempt — not fixed lineup / sort_order.
  const questions = shuffleWithSeed(picked, seed + 99);

  return NextResponse.json({
    level: questionLevel,
    campaignLevel: level,
    disciplines: subjectOrder,
    seed,
    questions,
  });
}
