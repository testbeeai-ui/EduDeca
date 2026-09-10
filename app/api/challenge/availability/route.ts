import { NextResponse } from "next/server";

import { CLASS_LEVEL_REQUIRED } from "@/lib/challenge/availability";
import { readyLevelsFromRows } from "@/lib/challenge/coverage";
import { fetchAllPaged } from "@/lib/supabase/fetch-all";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * Which campaign levels currently have a playable published bank.
 * Requires a session so RLS can see published questions.
 * Logged out is unknown, not an empty bank.
 */
export async function GET() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ready: null });
  }

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
      {
        ready: null,
        error: "Choose Class 11 or Class 12 to start",
        code: CLASS_LEVEL_REQUIRED,
      },
      { status: 409 },
    );
  }
  const studentClass = rawClass === 11 ? "XI" : "XII";

  type CoverageDbRow = {
    level: number;
    discipline_id: string;
    type: string | null;
    chapter: string | null;
    class_level: "XI" | "XII" | null;
  };

  let data: CoverageDbRow[];
  try {
    data = await fetchAllPaged<CoverageDbRow>((from, to) =>
      supabase
        .from("edudeca_discipline_questions")
        .select("level, discipline_id, type, chapter, class_level")
        .eq("published", true)
        .range(from, to),
    );
  } catch (err) {
    console.error("[challenge/availability]", err);
    return NextResponse.json({ error: "Failed to load availability" }, { status: 500 });
  }

  const rows = data.map((row) => ({
    level: row.level,
    subject_id: row.discipline_id,
    type: row.type,
    chapter: row.chapter,
    class_level: row.class_level,
  }));

  return NextResponse.json({
    ready: readyLevelsFromRows(rows, studentClass),
  });
}
