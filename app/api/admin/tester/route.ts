import { NextRequest, NextResponse } from "next/server";

import {
  adminJumpCampaignLevel,
  adminSkipDailyWait,
} from "@/lib/progress/server";
import { createSupabaseServer } from "@/lib/supabase/server";

type TesterActionBody =
  | { action: "skip_wait" }
  | { action: "jump_level"; level: 1 | 2 | 3 };

function parseBody(raw: unknown): TesterActionBody | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as { action?: string; level?: number };
  if (body.action === "skip_wait") return { action: "skip_wait" };
  if (body.action === "jump_level") {
    const level = Number(body.level);
    if (level === 1 || level === 2 || level === 3) {
      return { action: "jump_level", level };
    }
  }
  return null;
}

/**
 * Tester/investor tools — server-enforced allowlist.
 * Persists skip-wait / jump-level into edudeca_user_progress.
 */
export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const body = parseBody(raw);
  if (!body) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const progress =
      body.action === "skip_wait"
        ? await adminSkipDailyWait(supabase, user)
        : await adminJumpCampaignLevel(supabase, user, body.level);

    return NextResponse.json({ progress });
  } catch (err) {
    const status = (err as { status?: number }).status === 403 ? 403 : 500;
    if (status === 403) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[api/admin/tester]", err);
    return NextResponse.json({ error: "Failed to apply tester action" }, { status: 500 });
  }
}
