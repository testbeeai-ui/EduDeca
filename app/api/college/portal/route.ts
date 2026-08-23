import { NextResponse } from "next/server";

import {
  getApprovedCollegeForUser,
  getCollegeApplicationForUser,
  getRosterForInstitution,
} from "@/lib/college/registry-store";
import { studentTrackFromDisciplines } from "@/lib/college/student-track";
import { createSupabaseServer } from "@/lib/supabase/server";

function relativeLastActive(isoDate: string | null): string {
  if (!isoDate) return "—";
  const day = isoDate.slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  if (day === today) return "Today";
  const then = new Date(`${day}T12:00:00Z`).getTime();
  const now = new Date(`${today}T12:00:00Z`).getTime();
  const days = Math.round((now - then) / 86_400_000);
  if (days === 1) return "Yesterday";
  if (days > 1 && days < 14) return `${days} days ago`;
  return day;
}

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const application = await getCollegeApplicationForUser(data.user.id);
  if (!application) {
    return NextResponse.json({ error: "No college application" }, { status: 404 });
  }
  if (application.status !== "approved") {
    return NextResponse.json(
      { error: "College not verified yet", status: application.status },
      { status: 403 },
    );
  }

  const approved = await getApprovedCollegeForUser(data.user.id);
  if (!approved) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const roster = await getRosterForInstitution(approved.institutionName);
  const xi = roster.filter((s) => s.classLevel === 11).length;
  const xii = roster.filter((s) => s.classLevel === 12).length;
  const feesPaid = roster.filter((s) => s.isProctoredPaid).length;
  const avgLevel =
    roster.length === 0
      ? 0
      : roster.reduce((sum, s) => sum + s.campaignLevel, 0) / roster.length;

  const userIds = roster.map((s) => s.userId);
  const disciplinesByUser = new Map<string, string[]>();
  if (userIds.length > 0) {
    const { data: progressRows, error: progressError } = await supabase
      .from("edudeca_user_progress")
      .select("user_id, disciplines")
      .in("user_id", userIds);
    if (progressError) {
      console.error("[college/portal] disciplines lookup", progressError);
    } else {
      for (const row of progressRows ?? []) {
        if (!row || typeof row.user_id !== "string") continue;
        const raw = row.disciplines;
        disciplinesByUser.set(
          row.user_id,
          Array.isArray(raw) ? raw.map((id) => String(id)) : [],
        );
      }
    }
  }

  const students = roster.map((s) => {
    const active =
      !!s.lastChallengeDate &&
      Date.now() - new Date(`${s.lastChallengeDate.slice(0, 10)}T12:00:00Z`).getTime() <=
        7 * 86_400_000;
    return {
      userId: s.userId,
      name: s.displayName,
      roll: s.studentCode?.trim() || "—",
      cls: s.classLevel === 12 ? "XII" : s.classLevel === 11 ? "XI" : "—",
      track: studentTrackFromDisciplines(disciplinesByUser.get(s.userId)),
      level: s.campaignLevel,
      // Per-level % is not in present DB — portal shows em dash until a real score exists.
      score: null as number | null,
      fees: s.isProctoredPaid,
      status: active ? "active" : "inactive",
      last: relativeLastActive(s.lastChallengeDate),
      comment: "",
    };
  });

  return NextResponse.json({
    college: {
      institutionName: approved.institutionName,
      city: approved.city,
      state: approved.state,
      principalName: approved.principalName,
      contactName: approved.contactName,
      registeredAt: approved.submittedAt,
      verifiedAt: approved.verifiedAt,
      pledge: approved.pledge,
      xiDeclared: approved.xiCount,
      xiiDeclared: approved.xiiCount,
    },
    stats: {
      totalStudents: roster.length,
      classXi: xi,
      classXii: xii,
      feesPaidPct: roster.length === 0 ? 0 : Math.round((feesPaid / roster.length) * 100),
      avgLevel: Math.round(avgLevel * 10) / 10,
    },
    students,
  });
}
