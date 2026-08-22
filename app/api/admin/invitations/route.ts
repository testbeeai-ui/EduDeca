import { NextResponse } from "next/server";

import { isTesterInvestorEmail } from "@/lib/admin/tester-allowlist";
import {
  addAdminInviteBatch,
  checkAndSyncStudentConversion,
  dispatchQueuedInvites,
  getAdminInviteBatches,
  getAdminStudentInvites,
  parseStudentCsv,
  reconcileInvitesAlreadyRegistered,
  resendSingleInvite,
} from "@/lib/admin/invitations";
import { getSharedEmailQuota } from "@/lib/email/sharedEmailQuota";
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
    await reconcileInvitesAlreadyRegistered(supabase);

    const { searchParams } = new URL(request.url);
    const collegeFilter = searchParams.get("collegeName");

    let batches = await getAdminInviteBatches(supabase);
    let invites = await getAdminStudentInvites(supabase);

    if (collegeFilter && collegeFilter !== "all") {
      batches = batches.filter((b) => b.collegeName === collegeFilter);
      invites = invites.filter((i) => i.collegeName === collegeFilter);
    }

    const shared = await getSharedEmailQuota();

    return NextResponse.json({
      success: true,
      batches,
      invites,
      quota: {
        dailyLimit: shared.dailyLimit,
        sentToday: shared.sentToday,
        remainingToday: shared.remainingToday,
        queuedTomorrowTotal: invites.filter((i) => i.status === "queued_tomorrow")
          .length,
        istDate: shared.istDate,
        quotaSource: "shared_transactional_email_logs",
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
    const { collegeName, csvText, dailyLimit } = body;

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
    const sharedBefore = await getSharedEmailQuota();

    const {
      batch,
      sentCount,
      queuedCount,
      emailDelivered,
      emailFailed,
      sharedQuota,
    } = await addAdminInviteBatch(
      supabase,
      targetCollege,
      parsed.records,
      typeof dailyLimit === "number" ? dailyLimit : sharedBefore.remainingToday,
    );

    await reconcileInvitesAlreadyRegistered(supabase);

    return NextResponse.json({
      success: true,
      batch,
      sentCount,
      queuedCount,
      emailDelivered,
      emailFailed,
      quota: {
        dailyLimit: sharedQuota.dailyLimit,
        sentToday: sharedQuota.sentToday + emailDelivered,
        remainingToday: Math.max(
          0,
          sharedQuota.dailyLimit - (sharedQuota.sentToday + emailDelivered),
        ),
        istDate: sharedQuota.istDate,
        quotaSource: "shared_transactional_email_logs",
      },
      totalParsed: parsed.records.length,
      errors: parsed.errors,
      message: `Batch created for ${targetCollege}: ${sentCount} attempted under shared org quota (${emailDelivered} SMTP delivered, ${emailFailed} failed/blocked), ${queuedCount} queued. Cap ${sharedQuota.dailyLimit}/day IST (EduBlast + EduDeca).`,
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
      );
      const shared = await getSharedEmailQuota();
      return NextResponse.json({
        success: true,
        ...result,
        quota: {
          dailyLimit: shared.dailyLimit,
          sentToday: shared.sentToday,
          remainingToday: shared.remainingToday,
          istDate: shared.istDate,
          quotaSource: "shared_transactional_email_logs",
        },
        message: `Dispatched ${result.dispatched} queued invites (${result.emailDelivered} SMTP delivered, ${result.emailFailed} SMTP failed). Shared cap ${shared.sentToday}/${shared.dailyLimit} today IST.`,
      });
    }

    if (action === "resend_single" && inviteId) {
      const { invite, emailDelivered } = await resendSingleInvite(
        supabase,
        String(inviteId),
      );
      const shared = await getSharedEmailQuota();
      return NextResponse.json({
        success: true,
        emailDelivered,
        quota: {
          dailyLimit: shared.dailyLimit,
          sentToday: shared.sentToday,
          remainingToday: shared.remainingToday,
          istDate: shared.istDate,
          quotaSource: "shared_transactional_email_logs",
        },
        message: emailDelivered
          ? `Invitation email resent to ${invite?.email || inviteId}.`
          : `Invite updated for ${invite?.email || inviteId}, but SMTP delivery failed, was blocked by shared daily cap, or is not configured.`,
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
