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
  dailyLimit = INVITE_DAILY_LIMIT,
): Promise<{
  batch: CollegeInviteBatch;
  sentCount: number;
  queuedCount: number;
  emailDelivered: number;
  emailFailed: number;
}> {
  const batchId = `batch-${Date.now()}`;
  const nowIso = new Date().toISOString();

  let xiCount = 0;
  let xiiCount = 0;
  parsedRecords.forEach((r) => {
    if (r.classLevel === 11) xiCount++;
    if (r.classLevel === 12) xiiCount++;
  });

  const statuses = planInviteStatuses(parsedRecords.length, dailyLimit);
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
        : `Daily email quota reached (${dailyLimit}/day). Scheduled for tomorrow.`,
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
  for (const rec of newRecords) {
    if (rec.status !== "sent") continue;
    const delivered = await deliverInviteMail(rec);
    if (delivered) {
      emailDelivered++;
      continue;
    }
    emailFailed++;
    await supabase
      .from("edudeca_student_invitations")
      .update({
        notes: "Invite saved in DB; SMTP delivery failed or not configured.",
      })
      .eq("id", rec.id);
  }

  return { batch, sentCount, queuedCount, emailDelivered, emailFailed };
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

export async function dispatchQueuedInvites(
  supabase: SupabaseClient,
  batchId?: string,
  dailyLimit = INVITE_DAILY_LIMIT,
): Promise<{ dispatched: number; emailDelivered: number; emailFailed: number }> {
  let query = supabase
    .from("edudeca_student_invitations")
    .select("*")
    .eq("status", "queued_tomorrow")
    .order("created_at", { ascending: true })
    .limit(dailyLimit);

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

    const { error: upErr } = await supabase
      .from("edudeca_student_invitations")
      .update({
        status: "sent",
        invited_at: nowIso,
        notes: delivered
          ? "Dispatched via admin daily quota release."
          : "Marked sent in DB; SMTP delivery failed or not configured.",
      })
      .eq("id", invite.id);
    if (upErr) {
      console.error("[invitations] dispatch update failed", upErr.message);
      continue;
    }
    dispatched++;
    if (delivered) emailDelivered++;
    else emailFailed++;
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
  const { data: updated, error: upErr } = await supabase
    .from("edudeca_student_invitations")
    .update({
      status: invite.status === "joined" ? "joined" : "sent",
      invited_at: nowIso,
      notes: delivered
        ? "Resent invite email."
        : "Resend attempted; SMTP delivery failed or not configured.",
    })
    .eq("id", inviteId)
    .select("*")
    .maybeSingle();

  if (upErr) throw new Error(upErr.message);
  if (updated) await refreshBatchCounts(supabase, invite.batchId);
  return {
    invite: updated ? mapInviteRow(updated as Record<string, unknown>) : invite,
    emailDelivered: delivered,
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
