import { NextRequest, NextResponse } from "next/server";

import { DISCIPLINE_IDS, LINEUP_SIZE, type DisciplineId } from "@/data/disciplines";
import { isTesterInvestorEmail } from "@/lib/admin/tester-allowlist";
import { CLASS_LEVEL_REQUIRED, QUESTIONS_UNAVAILABLE } from "@/lib/challenge/availability";
import { parseQuestionOptions } from "@/lib/challenge/parse-options";
import { pickUnseenRound } from "@/lib/challenge/question-seen";
import { listSeenQuestionIds } from "@/lib/challenge/question-seen-store";
import { attemptSeed, shuffleChallengeOptions } from "@/lib/challenge/shuffle";
import {
  challengeGroupsPerDiscipline,
  challengeQuestionCount,
} from "@/lib/challenge/spec";
import { countLevelFailTrials } from "@/lib/challenge/trial-store";
import { gateStudentLevelAccess, trialGateMessage } from "@/lib/challenge/trials";
import { isLineupComplete, lineupIds, validateLineup } from "@/lib/disciplines/selection";
import { getOrCreateProgress } from "@/lib/progress/server";
import { fetchAllPaged } from "@/lib/supabase/fetch-all";
import { requireApiUser } from "@/lib/supabase/require-user";
import type { ChallengeQuestion } from "@/lib/types";

type QuestionRow = {
  id: string;
  discipline_id: string;
  stem: string;
  options: string[] | unknown;
  correct_index: number;
  explanation: string | null;
  difficulty_rating: number | null;
  level: number;
  published?: boolean;
  type: string | null;
  chapter: string | null;
  class_level: "XI" | "XII" | null;
};

function parseLevel(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 10) return null;
  return n;
}

function comingSoonResponse(level: number) {
  return NextResponse.json(
    {
      error: `Level ${level} questions are coming soon`,
      code: QUESTIONS_UNAVAILABLE,
      comingSoon: true,
      level,
    },
    { status: 404 },
  );
}

function parseDisciplinesParam(raw: string | null): DisciplineId[] | null {
  if (!raw) return null;
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const lineup = validateLineup(ids);
  if (!lineup || !isLineupComplete(lineup)) return null;
  return lineupIds(lineup);
}


/**
 * One unused published MCQ per lineup discipline at this campaign level.
 * Submitted cards (correct, wrong, skip) never repeat for this student.
 * Question order and option order are reshuffled each attempt.
 */
export async function GET(request: NextRequest) {
  const level = parseLevel(request.nextUrl.searchParams.get("level"));
  if (level == null) {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 });
  }

  const auth = await requireApiUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { supabase, user } = auth;

  const { data: profile, error: profileError } = await supabase
    .from("edudeca_profiles")
    .select("class_level")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }

  const rawClass = profile && typeof profile.class_level === "number" ? profile.class_level : null;
  if (rawClass !== 11 && rawClass !== 12) {
    return NextResponse.json(
      { error: "Choose Class 11 or Class 12 to start", code: CLASS_LEVEL_REQUIRED },
      { status: 409 },
    );
  }
  const studentClass = rawClass === 11 ? "XI" : "XII";

  const progress = await getOrCreateProgress(supabase, user);
  const unlimited = isTesterInvestorEmail(user.email);
  const failCount = await countLevelFailTrials(supabase, user.id, level);
  const gate = gateStudentLevelAccess({
    requestedLevel: level,
    campaignLevel: progress.campaignLevel,
    todayCompleted: progress.todayCompleted,
    failCount,
    unlimited,
  });
  if (gate !== "ok") {
    return NextResponse.json(trialGateMessage(gate), { status: 403 });
  }

  let subjectOrder: DisciplineId[] | null = null;
  const fromDb = progress.disciplines ? validateLineup(progress.disciplines) : null;
  if (fromDb && isLineupComplete(fromDb)) {
    subjectOrder = lineupIds(fromDb);
  }

  if (!subjectOrder) {
    subjectOrder = parseDisciplinesParam(request.nextUrl.searchParams.get("disciplines"));
  }

  if (!subjectOrder || subjectOrder.length !== LINEUP_SIZE) {
    return NextResponse.json({ error: "No disciplines lineup" }, { status: 400 });
  }

  const allowed = new Set<DisciplineId>(DISCIPLINE_IDS);
  if (subjectOrder.some((id) => !allowed.has(id))) {
    return NextResponse.json({ error: "Invalid disciplines" }, { status: 400 });
  }

  let rows: QuestionRow[];
  try {
    rows = await fetchAllPaged<QuestionRow>((from, to) =>
      supabase
        .from("edudeca_discipline_questions")
        .select(
          "id, discipline_id, stem, options, correct_index, explanation, difficulty_rating, level, published, type, chapter, class_level",
        )
        .eq("level", level)
        .eq("published", true)
        .in("discipline_id", subjectOrder)
        .range(from, to),
    );
  } catch (err) {
    console.error("[challenge/questions]", err);
    return NextResponse.json({ error: "Failed to load questions" }, { status: 500 });
  }

  const byId = new Map(rows.map((row) => [row.id, row]));
  let seenIds: Set<string>;
  try {
    seenIds = await listSeenQuestionIds(supabase, user.id, level);
  } catch {
    return NextResponse.json({ error: "Failed to load questions" }, { status: 500 });
  }

  const seed = attemptSeed(level, user.id, subjectOrder.join(","));
  const perDiscipline = challengeGroupsPerDiscipline(level);
  const expected = challengeQuestionCount(level);
  const picked = pickUnseenRound({
    bank: rows.map((row) => ({
      id: row.id,
      disciplineId: row.discipline_id,
      level: row.level,
      published: true,
      type: row.type,
      chapter: row.chapter,
      classLevel:
        row.class_level === "XI" || row.class_level === "XII" ? row.class_level : null,
    })),
    lineupIds: subjectOrder,
    seenIds,
    level,
    seed,
    studentClass,
    perDiscipline,
  });

  if (!picked.ok) {
    return comingSoonResponse(level);
  }

  const questions: ChallengeQuestion[] = [];
  picked.questions.forEach((item, idx) => {
    const row = byId.get(item.id);
    if (!row || row.level !== level) return;
    const options = parseQuestionOptions(row.options);
    if (options.length !== 4) return;
    const base: ChallengeQuestion = {
      id: row.id,
      subjectId: row.discipline_id,
      stem: row.stem,
      options,
      correctIndex: row.correct_index,
      explanation: row.explanation ?? undefined,
      difficultyRating: row.difficulty_rating ?? undefined,
      type: row.type ?? null,
      chapter: row.chapter ?? null,
    };
    questions.push(shuffleChallengeOptions(base, seed + idx * 31));
  });

  if (questions.length !== expected) {
    return comingSoonResponse(level);
  }

  return NextResponse.json({
    level: level,
    campaignLevel: level,
    disciplines: subjectOrder,
    seed,
    questions,
  });
}
