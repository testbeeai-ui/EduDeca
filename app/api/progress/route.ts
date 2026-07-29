import { NextRequest, NextResponse } from "next/server";

import { validateLineup, lineupIds } from "@/lib/disciplines/selection";
import {
  getOrCreateProgress,
  updateAntiCapture,
  updateDisciplines,
} from "@/lib/progress/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/** Load (or create) signed-in user progress from Supabase. */
export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const progress = await getOrCreateProgress(supabase, user);
    return NextResponse.json({ progress });
  } catch (err) {
    console.error("[api/progress GET]", err);
    return NextResponse.json({ error: "Failed to load progress" }, { status: 500 });
  }
}

/**
 * Patch progress fields:
 * - antiCaptureEnabled → tester/admin only
 * - disciplines → any signed-in user (10-slot lineup from walkthrough)
 */
export async function PATCH(request: NextRequest) {
  let body: { antiCaptureEnabled?: boolean; disciplines?: string[] };
  try {
    body = (await request.json()) as {
      antiCaptureEnabled?: boolean;
      disciplines?: string[];
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const hasAnti = typeof body.antiCaptureEnabled === "boolean";
  const hasDisciplines = Array.isArray(body.disciplines);

  if (!hasAnti && !hasDisciplines) {
    return NextResponse.json(
      { error: "antiCaptureEnabled or disciplines required" },
      { status: 400 },
    );
  }

  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let progress = await getOrCreateProgress(supabase, user);

    if (hasDisciplines) {
      const lineup = validateLineup(body.disciplines);
      if (!lineup) {
        return NextResponse.json({ error: "Invalid disciplines lineup" }, { status: 400 });
      }
      progress = await updateDisciplines(supabase, user, lineupIds(lineup));
    }

    if (hasAnti) {
      progress = await updateAntiCapture(supabase, user, body.antiCaptureEnabled!);
    }

    return NextResponse.json({ progress });
  } catch (err) {
    const status = (err as { status?: number }).status === 403 ? 403 : 500;
    if (status === 403) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[api/progress PATCH]", err);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
