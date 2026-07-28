import { NextRequest, NextResponse } from "next/server";

import {
  getOrCreateProgress,
  updateAntiCapture,
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

/** Admin-only: update anti-capture preference. */
export async function PATCH(request: NextRequest) {
  let body: { antiCaptureEnabled?: boolean };
  try {
    body = (await request.json()) as { antiCaptureEnabled?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.antiCaptureEnabled !== "boolean") {
    return NextResponse.json({ error: "antiCaptureEnabled required" }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const progress = await updateAntiCapture(supabase, user, body.antiCaptureEnabled);
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
