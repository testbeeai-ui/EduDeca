import { NextResponse } from "next/server";

import { isTesterInvestorEmail } from "@/lib/admin/tester-allowlist";
import {
  addAdminInviteBatch,
  checkAndSyncStudentConversion,
  dispatchQueuedInvites,
  getAdminInviteBatches,
  getAdminStudentInvites,
  parseStudentCsv,
  resendSingleInvite,
} from "@/lib/admin/invitations";
import { INVITE_DAILY_LIMIT } from "@/lib/admin/invite-types";
import { createSupabaseServer } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email || !isTesterInvestorEmail(user.email)) {
    return { supabase, user: null as null };
  }
  return { supabase, user };
}

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 403 });
    }

    await checkAndSyncStudentConversion(supabase);

    const { searchParams } = new URL(request.url);
    const collegeFilter = searchParams.get("collegeName");

    let batches = await getAdminInviteBatches(supabase);
    let invites = await getAdminStudentInvites(supabase);

    if (collegeFilter && collegeFilter !== "all") {
      batches = batches.filter((b) => b.collegeName === collegeFilter);
      invites = invites.filter((i) => i.collegeName === collegeFilter);
    }

    const startOfUtcDay = new Date();
    startOfUtcDay.setUTCHours(0, 0, 0, 0);
    const sentToday = invites.filter(
      (i) =>
        (i.status === "sent" || i.status === "joined") &&
        i.invitedAt &&
        new Date(i.invitedAt) >= startOfUtcDay,
    ).length;

    return NextResponse.json({
      success: true,
      batches,
      invites,
      quota: {
        dailyLimit: INVITE_DAILY_LIMIT,
        sentToday,
        remainingToday: Math.max(0, INVITE_DAILY_LIMIT - sentToday),
        queuedTomorrowTotal: invites.filter((i) => i.status === "queued_tomorrow")
          .length,
      },
    });
  } catch (error) {
    console.error("[api/admin/invitations GET]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 403 });
    }

    const body = await request.json();
    const { collegeName, csvText, dailyLimit = INVITE_DAILY_LIMIT } = body;

    if (!csvText || typeof csvText !== "string") {
      return NextResponse.json({ error: "Missing CSV data" }, { status: 400 });
    }

    const parsed = parseStudentCsv(csvText, collegeName || "Vishwa College");

    if (parsed.records.length === 0) {
      return NextResponse.json(
        { error: "No valid student emails found in uploaded CSV", details: parsed.errors },
        { status: 400 },
      );
    }

    const targetCollege = parsed.collegeNameDetected || collegeName || "Vishwa College";

    const { batch, sentCount, queuedCount, emailDelivered, emailFailed } =
      await addAdminInviteBatch(
        supabase,
        targetCollege,
        parsed.records,
        Number(dailyLimit),
      );

    return NextResponse.json({
      success: true,
      batch,
      sentCount,
      queuedCount,
      emailDelivered,
      emailFailed,
      totalParsed: parsed.records.length,
      errors: parsed.errors,
      message: `Batch created for ${targetCollege}: ${sentCount} invites marked for today (${emailDelivered} SMTP delivered, ${emailFailed} SMTP failed), ${queuedCount} queued.`,
    });
  } catch (error) {
    console.error("[api/admin/invitations POST]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process invitation batch",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { supabase, user } = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 403 });
    }

    const body = await request.json();
    const { action, batchId, inviteId } = body;

    if (action === "dispatch_queued") {
      const result = await dispatchQueuedInvites(
        supabase,
        typeof batchId === "string" ? batchId : undefined,
        INVITE_DAILY_LIMIT,
      );
      return NextResponse.json({
        success: true,
        ...result,
        message: `Dispatched ${result.dispatched} queued invites (${result.emailDelivered} SMTP delivered, ${result.emailFailed} SMTP failed).`,
      });
    }

    if (action === "resend_single" && inviteId) {
      const { invite, emailDelivered } = await resendSingleInvite(
        supabase,
        String(inviteId),
      );
      return NextResponse.json({
        success: true,
        emailDelivered,
        message: emailDelivered
          ? `Invitation email resent to ${invite?.email || inviteId}.`
          : `Invite updated for ${invite?.email || inviteId}, but SMTP delivery failed or is not configured.`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[api/admin/invitations PATCH]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update invitations",
      },
      { status: 500 },
    );
  }
}
