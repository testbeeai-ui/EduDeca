import type { SupabaseClient } from "@supabase/supabase-js";

import {
  countPlannedStatuses,
  normalizeInviteEmail,
  planInviteStatuses,
} from "@/lib/admin/invite-dispatch";
import {
  INVITE_DAILY_LIMIT,
  type CollegeInviteBatch,
  type StudentInviteRecord,
  type StudentInviteStatus,
} from "@/lib/admin/invite-types";
import { sendCollegeStudentInviteEmail } from "@/lib/email/sendCollegeInviteEmail";
import {
  createEmailAdminClient,
  getSharedEmailQuota,
} from "@/lib/email/sharedEmailQuota";

export type {
  CollegeInviteBatch,
  DailyQuotaStatus,
  StudentInviteRecord,
  StudentInviteStatus,
} from "@/lib/admin/invite-types";
export { INVITE_DAILY_LIMIT, EDUDECA_PUBLIC_SIGNIN_URL } from "@/lib/admin/invite-types";
export { parseStudentCsv } from "@/lib/admin/invite-csv";
export { generateCollegeInviteEmailHtml } from "@/lib/email/collegeInviteEmailTemplate";

async function deliverInviteMail(invite: {
  email: string;
  name: string | null;
  collegeName: string;
  studentCode: string | null;
}): Promise<boolean> {
  return sendCollegeStudentInviteEmail({
    email: invite.email,
    name: invite.name || invite.email.split("@")[0],
    collegeName: invite.collegeName,
    studentCode: invite.studentCode,
  });
}

function mapBatchRow(b: Record<string, unknown>): CollegeInviteBatch {
  return {
    id: String(b.id),
    collegeName: String(b.college_name),
    totalCount: Number(b.total_count) || 0,
    sentCount: Number(b.sent_count) || 0,
    queuedCount: Number(b.queued_count) || 0,
    joinedCount: Number(b.joined_count) || 0,
    uploadedAt: String(b.uploaded_at),
    xiCount: Number(b.xi_count) || 0,
    xiiCount: Number(b.xii_count) || 0,
  };
}

function mapInviteRow(i: Record<string, unknown>): StudentInviteRecord {
  return {
    id: String(i.id),
    batchId: String(i.batch_id),
    collegeName: String(i.college_name),
    email: String(i.email),
    name: (i.name as string | null) ?? null,
    studentCode: (i.student_code as string | null) ?? null,
    classLevel: (i.class_level as 11 | 12 | null) ?? null,
    status: i.status as StudentInviteStatus,
    invitedAt: (i.invited_at as string | null) ?? null,
    joinedAt: (i.joined_at as string | null) ?? null,
    notes: (i.notes as string | null) ?? null,
  };
}

export async function getAdminInviteBatches(
  supabase: SupabaseClient,
): Promise<CollegeInviteBatch[]> {
  const { data, error } = await supabase
    .from("edudeca_invite_batches")
    .select("*")
    .order("uploaded_at", { ascending: false });

  if (error) {
    console.error("[invitations] batch query error", error.message);
    throw new Error(`Failed to load invite batches: ${error.message}`);
  }
  return (data ?? []).map((b) => mapBatchRow(b as Record<string, unknown>));
}

export async function getAdminStudentInvites(
  supabase: SupabaseClient,
): Promise<StudentInviteRecord[]> {
  const { data, error } = await supabase
    .from("edudeca_student_invitations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[invitations] invites query error", error.message);
    throw new Error(`Failed to load student invitations: ${error.message}`);
  }
  return (data ?? []).map((i) => mapInviteRow(i as Record<string, unknown>));
}

export async function addAdminInviteBatch(
  supabase: SupabaseClient,
  collegeName: string,
  parsedRecords: Omit<
    StudentInviteRecord,
    "id" | "batchId" | "status" | "invitedAt" | "joinedAt"
  >[],
  requestedBatchLimit = INVITE_DAILY_LIMIT,
): Promise<{
  batch: CollegeInviteBatch;
  sentCount: number;
  queuedCount: number;
  emailDelivered: number;
  emailFailed: number;
  sharedQuota: Awaited<ReturnType<typeof getSharedEmailQuota>>;
}> {
  const batchId = `batch-${Date.now()}`;
  const nowIso = new Date().toISOString();

  let xiCount = 0;
  let xiiCount = 0;
  parsedRecords.forEach((r) => {
    if (r.classLevel === 11) xiCount++;
    if (r.classLevel === 12) xiiCount++;
  });

  // Shared EduBlast+EduDeca IST cap — never invent a separate EduDeca pool.
  const sharedQuota = await getSharedEmailQuota();
  const sendBudget = Math.max(
    0,
    Math.min(
      Number.isFinite(requestedBatchLimit)
        ? Math.floor(requestedBatchLimit)
        : sharedQuota.remainingToday,
      sharedQuota.remainingToday,
    ),
  );

  const statuses = planInviteStatuses(parsedRecords.length, sendBudget);
  const { sentCount, queuedCount } = countPlannedStatuses(statuses);

  const newRecords: StudentInviteRecord[] = parsedRecords.map((rec, index) => {
    const status = statuses[index]!;
    const isSent = status === "sent";
    return {
      id: `inv-${Date.now()}-${index}`,
      batchId,
      collegeName: rec.collegeName || collegeName,
      email: normalizeInviteEmail(rec.email),
      name: rec.name,
      studentCode: rec.studentCode,
      classLevel: rec.classLevel,
      status,
      invitedAt: isSent ? nowIso : null,
      joinedAt: null,
      notes: isSent
        ? null
        : `Shared org email quota reached (${sharedQuota.sentToday}/${sharedQuota.dailyLimit} sent today IST across EduBlast + EduDeca). Queued for tomorrow.`,
    };
  });

  const batch: CollegeInviteBatch = {
    id: batchId,
    collegeName,
    totalCount: parsedRecords.length,
    sentCount,
    queuedCount,
    joinedCount: 0,
    uploadedAt: nowIso,
    xiCount,
    xiiCount,
  };

  const { error: batchErr } = await supabase.from("edudeca_invite_batches").insert({
    id: batch.id,
    college_name: batch.collegeName,
    total_count: batch.totalCount,
    sent_count: batch.sentCount,
    queued_count: batch.queuedCount,
    joined_count: batch.joinedCount,
    uploaded_at: batch.uploadedAt,
    xi_count: batch.xiCount,
    xii_count: batch.xiiCount,
  });
  if (batchErr) {
    throw new Error(`Failed to save invite batch: ${batchErr.message}`);
  }

  const { error: inviteErr } = await supabase
    .from("edudeca_student_invitations")
    .insert(
      newRecords.map((r) => ({
        id: r.id,
        batch_id: r.batchId,
        college_name: r.collegeName,
        email: r.email,
        name: r.name,
        student_code: r.studentCode,
        class_level: r.classLevel,
        status: r.status,
        invited_at: r.invitedAt,
        joined_at: r.joinedAt,
        notes: r.notes,
      })),
    );
  if (inviteErr) {
    await supabase.from("edudeca_invite_batches").delete().eq("id", batch.id);
    throw new Error(`Failed to save student invitations: ${inviteErr.message}`);
  }

  let emailDelivered = 0;
  let emailFailed = 0;

  // Branded SMTP only — never inviteUserByEmail / OTP (Google Auth only).
  // Status "sent" is provisional until SMTP + transactional_email_logs succeed.
  for (const rec of newRecords) {
    if (rec.status !== "sent") continue;
    const delivered = await deliverInviteMail(rec);
    if (delivered) {
      emailDelivered++;
      continue;
    }
    emailFailed++;
    // Do not keep a fake "sent" that skips the shared EduBlast quota log.
    await supabase
      .from("edudeca_student_invitations")
      .update({
        status: "queued_tomorrow",
        invited_at: null,
        notes:
          "SMTP delivery failed or not configured — re-queued. Shared quota only counts rows in transactional_email_logs.",
      })
      .eq("id", rec.id);
  }

  if (emailFailed > 0) {
    await refreshBatchCounts(supabase, batch.id);
    const refreshed = (await getAdminInviteBatches(supabase)).find(
      (b) => b.id === batch.id,
    );
    if (refreshed) {
      return {
        batch: refreshed,
        sentCount: refreshed.sentCount,
        queuedCount: refreshed.queuedCount,
        emailDelivered,
        emailFailed,
        sharedQuota: await getSharedEmailQuota(),
      };
    }
  }

  return {
    batch,
    sentCount,
    queuedCount,
    emailDelivered,
    emailFailed,
    sharedQuota: await getSharedEmailQuota(),
  };
}

/** Mark invites joined for the signed-in JWT email (SECURITY DEFINER RPC). */
export async function checkAndSyncStudentConversion(
  supabase: SupabaseClient,
): Promise<number> {
  const { data, error } = await supabase.rpc("edudeca_sync_invite_conversion");
  if (error) {
    console.error("[invitations] conversion sync error", error.message);
    return 0;
  }
  return typeof data === "number" ? data : 0;
}

/**
 * Mark invite rows DONE (joined) when the email already exists on EduDeca profiles.
 * Prefers SECURITY DEFINER RPC; falls back to service-role profile lookup.
 */
export async function reconcileInvitesAlreadyRegistered(
  supabase: SupabaseClient,
): Promise<number> {
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "edudeca_reconcile_invite_registrations",
  );
  if (!rpcError) {
    return typeof rpcData === "number" ? rpcData : 0;
  }

  const admin = createEmailAdminClient();
  if (!admin) {
    console.error(
      "[invitations] register reconcile skipped — RPC missing and no SUPABASE_SERVICE_ROLE_KEY",
      rpcError.message,
    );
    return 0;
  }

  const { data: openInvites, error: inviteErr } = await admin
    .from("edudeca_student_invitations")
    .select("id, email, batch_id, notes, joined_at")
    .neq("status", "joined");

  if (inviteErr) {
    console.error("[invitations] register reconcile invite load", inviteErr.message);
    return 0;
  }
  if (!openInvites?.length) return 0;

  const emails = [
    ...new Set(
      openInvites
        .map((row) => normalizeInviteEmail(String(row.email ?? "")))
        .filter(Boolean),
    ),
  ];
  const emailSet = new Set(emails);

  const { data: profiles, error: profileErr } = await admin
    .from("edudeca_profiles")
    .select("email")
    .not("email", "is", null);

  if (profileErr) {
    console.error("[invitations] register reconcile profile load", profileErr.message);
    return 0;
  }

  const registered = new Set<string>();
  for (const profile of profiles ?? []) {
    const email = normalizeInviteEmail(String(profile.email ?? ""));
    if (email && emailSet.has(email)) registered.add(email);
  }

  if (registered.size === 0) return 0;

  const nowIso = new Date().toISOString();
  const batchIds = new Set<string>();
  let updated = 0;

  for (const row of openInvites) {
    const email = normalizeInviteEmail(String(row.email ?? ""));
    if (!email || !registered.has(email)) continue;

    const prevNotes = typeof row.notes === "string" ? row.notes : "";
    const note =
      !prevNotes.trim()
        ? "DONE — email already registered on EduDeca."
        : /already registered/i.test(prevNotes)
          ? prevNotes
          : `${prevNotes} | DONE — email already registered on EduDeca.`;

    const { error: upErr } = await admin
      .from("edudeca_student_invitations")
      .update({
        status: "joined",
        joined_at: (row.joined_at as string | null) ?? nowIso,
        notes: note,
      })
      .eq("id", row.id);

    if (upErr) {
      console.error("[invitations] register reconcile update", upErr.message);
      continue;
    }
    updated += 1;
    if (row.batch_id) batchIds.add(String(row.batch_id));
  }

  for (const batchId of batchIds) {
    await refreshBatchCounts(admin, batchId);
  }

  return updated;
}

export async function dispatchQueuedInvites(
  supabase: SupabaseClient,
  batchId?: string,
): Promise<{ dispatched: number; emailDelivered: number; emailFailed: number }> {
  const sharedQuota = await getSharedEmailQuota();
  const sendBudget = sharedQuota.remainingToday;
  if (sendBudget <= 0) {
    return { dispatched: 0, emailDelivered: 0, emailFailed: 0 };
  }

  let query = supabase
    .from("edudeca_student_invitations")
    .select("*")
    .eq("status", "queued_tomorrow")
    .order("created_at", { ascending: true })
    .limit(sendBudget);

  if (batchId) {
    query = query.eq("batch_id", batchId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load queued invites: ${error.message}`);
  const rows = data ?? [];
  if (rows.length === 0) {
    return { dispatched: 0, emailDelivered: 0, emailFailed: 0 };
  }

  const nowIso = new Date().toISOString();
  let dispatched = 0;
  let emailDelivered = 0;
  let emailFailed = 0;

  for (const row of rows) {
    const invite = mapInviteRow(row as Record<string, unknown>);
    const delivered = await deliverInviteMail(invite);
    if (!delivered) {
      emailFailed++;
      await supabase
        .from("edudeca_student_invitations")
        .update({
          notes:
            "Dispatch attempted; SMTP failed — still queued. Quota uses transactional_email_logs only.",
        })
        .eq("id", invite.id);
      continue;
    }

    const { error: upErr } = await supabase
      .from("edudeca_student_invitations")
      .update({
        status: "sent",
        invited_at: nowIso,
        notes: "Dispatched via admin daily quota release (logged in transactional_email_logs).",
      })
      .eq("id", invite.id);
    if (upErr) {
      console.error("[invitations] dispatch update failed", upErr.message);
      continue;
    }
    dispatched++;
    emailDelivered++;
  }

  const batchIds = [...new Set(rows.map((r) => String(r.batch_id)))];
  for (const id of batchIds) {
    await refreshBatchCounts(supabase, id);
  }
  return { dispatched, emailDelivered, emailFailed };
}

export async function resendSingleInvite(
  supabase: SupabaseClient,
  inviteId: string,
): Promise<{ invite: StudentInviteRecord | null; emailDelivered: boolean }> {
  const { data, error } = await supabase
    .from("edudeca_student_invitations")
    .select("*")
    .eq("id", inviteId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { invite: null, emailDelivered: false };

  const invite = mapInviteRow(data as Record<string, unknown>);
  const delivered = await deliverInviteMail(invite);

  const nowIso = new Date().toISOString();
  if (!delivered) {
    const { data: updated, error: upErr } = await supabase
      .from("edudeca_student_invitations")
      .update({
        notes: "Resend attempted; SMTP delivery failed or not configured.",
      })
      .eq("id", inviteId)
      .select("*")
      .maybeSingle();
    if (upErr) throw new Error(upErr.message);
    return {
      invite: updated ? mapInviteRow(updated as Record<string, unknown>) : invite,
      emailDelivered: false,
    };
  }

  const { data: updated, error: upErr } = await supabase
    .from("edudeca_student_invitations")
    .update({
      status: invite.status === "joined" ? "joined" : "sent",
      invited_at: nowIso,
      notes: "Resent invite email (logged in transactional_email_logs).",
    })
    .eq("id", inviteId)
    .select("*")
    .maybeSingle();

  if (upErr) throw new Error(upErr.message);
  if (updated) await refreshBatchCounts(supabase, invite.batchId);
  return {
    invite: updated ? mapInviteRow(updated as Record<string, unknown>) : invite,
    emailDelivered: true,
  };
}

async function refreshBatchCounts(
  supabase: SupabaseClient,
  batchId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("edudeca_student_invitations")
    .select("status")
    .eq("batch_id", batchId);
  if (error || !data) return;

  let sentCount = 0;
  let queuedCount = 0;
  let joinedCount = 0;
  for (const row of data) {
    if (row.status === "joined") joinedCount++;
    else if (row.status === "sent") sentCount++;
    else if (row.status === "queued_tomorrow") queuedCount++;
  }

  await supabase
    .from("edudeca_invite_batches")
    .update({
      sent_count: sentCount,
      queued_count: queuedCount,
      joined_count: joinedCount,
      total_count: data.length,
    })
    .eq("id", batchId);
}
