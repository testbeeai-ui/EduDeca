import { NextResponse } from "next/server";

import { syncStudentOntoMatchingCollegeRoster } from "@/lib/college/registry-store";
import { requireApiUser } from "@/lib/supabase/require-user";

export async function POST() {
  const auth = await requireApiUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { supabase, user } = auth;

  const userId = user.id;
  const meta = user.user_metadata ?? {};
  const displayName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    user.email?.split("@")[0] ||
    "Student";

  const { data: profile } = await supabase
    .from("edudeca_profiles")
    .select("institution_name, class_level, state, city")
    .eq("id", userId)
    .maybeSingle();

  const { data: progress } = await supabase
    .from("edudeca_user_progress")
    .select("campaign_level, is_proctored_paid, last_challenge_date")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: shared } = await supabase
    .from("profiles")
    .select("student_code")
    .eq("id", userId)
    .maybeSingle();

  const result = await syncStudentOntoMatchingCollegeRoster({
    userId,
    displayName,
    studentCode:
      shared && typeof shared.student_code === "string" ? shared.student_code : null,
    institutionName:
      profile && typeof profile.institution_name === "string"
        ? profile.institution_name
        : null,
    state: profile && typeof profile.state === "string" ? profile.state : null,
    city: profile && typeof profile.city === "string" ? profile.city : null,
    classLevel:
      profile && typeof profile.class_level === "number" ? profile.class_level : null,
    campaignLevel:
      progress && typeof progress.campaign_level === "number"
        ? progress.campaign_level
        : 1,
    isProctoredPaid: Boolean(progress?.is_proctored_paid),
    lastChallengeDate:
      progress && typeof progress.last_challenge_date === "string"
        ? progress.last_challenge_date
        : null,
  });

  return NextResponse.json(result);
}
