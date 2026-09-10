import { NextResponse } from "next/server";

import { isTesterInvestorEmail } from "@/lib/admin/tester-allowlist";
import { countLevelFailTrials } from "@/lib/challenge/trial-store";
import {
  gateStudentLevelAccess,
  remainingTrialsPayload,
  STUDENT_TRIALS_PER_LEVEL,
} from "@/lib/challenge/trials";
import { getOrCreateProgress } from "@/lib/progress/server";
import { requireApiUser } from "@/lib/supabase/require-user";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { supabase, user } = auth;

  const progress = await getOrCreateProgress(supabase, user);
  const unlimited = isTesterInvestorEmail(user.email);
  const failCount = await countLevelFailTrials(supabase, user.id, progress.campaignLevel);
  const gate = gateStudentLevelAccess({
    requestedLevel: progress.campaignLevel,
    campaignLevel: progress.campaignLevel,
    todayCompleted: progress.todayCompleted,
    failCount,
    unlimited,
  });

  return NextResponse.json({
    level: progress.campaignLevel,
    unlimited,
    failCount,
    remaining: remainingTrialsPayload(failCount, unlimited),
    limit: STUDENT_TRIALS_PER_LEVEL,
    gate,
  });
}
