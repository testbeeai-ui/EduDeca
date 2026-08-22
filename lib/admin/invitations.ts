import type { SupabaseClient } from "@supabase/supabase-js";

import {
  countPlannedStatuses,
  normalizeInviteEmail,
  planInviteStatuses,
} from "@/lib/admin/invite-dispatch";
import { sendCollegeStudentInviteEmail } from "@/lib/email/sendCollegeInviteEmail";

export type StudentInviteStatus = "joined" | "sent" | "queued_tomorrow" | "pending";

export interface StudentInviteRecord {
  id: string;
  batchId: string;
  collegeName: string;
  email: string;
  name: string | null;
  studentCode: string | null;
  classLevel: 11 | 12 | null;
  status: StudentInviteStatus;
  invitedAt: string | null;
  joinedAt: string | null;
  notes?: string | null;
}

export interface CollegeInviteBatch {
  id: string;
  collegeName: string;
  totalCount: number;
  sentCount: number;
  queuedCount: number;
  joinedCount: number;
  uploadedAt: string;
  xiCount: number;
  xiiCount: number;
}

export interface DailyQuotaStatus {
  dailyLimit: number;
  sentToday: number;
  remainingToday: number;
  queuedTomorrowTotal: number;
}

export { generateCollegeInviteEmailHtml } from "@/lib/email/collegeInviteEmailTemplate";

/** Flexible CSV / text parser that handles real-world variations in header names. */
export function parseStudentCsv(
  csvText: string,
  defaultCollegeName = "Vishwa College",
): {
  records: Omit<StudentInviteRecord, "id" | "batchId" | "status" | "invitedAt" | "joinedAt">[];
  collegeNameDetected: string;
  xiCount: number;
  xiiCount: number;
  errors: string[];
} {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return {
      records: [],
      collegeNameDetected: defaultCollegeName,
      xiCount: 0,
      xiiCount: 0,
      errors: ["CSV file is empty"],
    };
  }

  const firstLine = lines[0];
  const delimiter = firstLine.includes("\t")
    ? "\t"
    : firstLine.includes(";")
      ? ";"
      : ",";

  const splitRow = (row: string) =>
    row.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ""));

  const headers = splitRow(lines[0]).map((h) => h.toLowerCase());

  let emailIdx = headers.findIndex((h) =>
    /email|e-mail|mail|email_address|mail_id/.test(h),
  );
  let nameIdx = headers.findIndex((h) =>
    /name|student_name|full_name|candidate_name/.test(h),
  );
  let codeIdx = headers.findIndex((h) =>
    /id|student_id|code|student_code|roll|reg|usn|admission/.test(h),
  );
  let classIdx = headers.findIndex((h) =>
    /class|grade|level|standard|std|class_level/.test(h),
  );
  let collegeIdx = headers.findIndex((h) =>
    /college|institution|school|college_name/.test(h),
  );

  const hasHeaderRow =
    emailIdx !== -1 || nameIdx !== -1 || codeIdx !== -1 || classIdx !== -1;
  const startRow = hasHeaderRow ? 1 : 0;

  if (!hasHeaderRow) {
    emailIdx = 0;
    nameIdx = 1;
    codeIdx = 2;
    classIdx = 3;
  }

  const records: Omit<
    StudentInviteRecord,
    "id" | "batchId" | "status" | "invitedAt" | "joinedAt"
  >[] = [];
  let detectedCollege = defaultCollegeName;
  let xiCount = 0;
  let xiiCount = 0;
  const errors: string[] = [];

  for (let i = startRow; i < lines.length; i++) {
    const cols = splitRow(lines[i]);
    if (cols.length === 0 || cols.every((c) => c === "")) continue;

    let email = (cols[emailIdx] || "").trim();
    if (!email.includes("@")) {
      const foundEmail = cols.find((c) => c.includes("@") && c.includes("."));
      if (foundEmail) email = foundEmail.trim();
    }

    if (!email || !email.includes("@")) {
      errors.push(`Row ${i + 1}: Skipping invalid or missing email (${cols.join(", ")})`);
      continue;
    }

    const name =
      nameIdx !== -1 && cols[nameIdx] ? cols[nameIdx].trim() : email.split("@")[0];
    const studentCode =
      codeIdx !== -1 && cols[codeIdx] ? cols[codeIdx].trim() : null;

    let classLevel: 11 | 12 | null = null;
    if (classIdx !== -1 && cols[classIdx]) {
      const rawClass = cols[classIdx].toLowerCase();
      if (rawClass.includes("11") || rawClass.includes("xi")) {
        classLevel = 11;
        xiCount++;
      } else if (rawClass.includes("12") || rawClass.includes("xii")) {
        classLevel = 12;
        xiiCount++;
      }
    }

    if (collegeIdx !== -1 && cols[collegeIdx] && cols[collegeIdx].trim()) {
      detectedCollege = cols[collegeIdx].trim();
    }

    records.push({
      collegeName: detectedCollege,
      email: normalizeInviteEmail(email),
      name,
      studentCode,
      classLevel,
    });
  }

  return {
    records,
    collegeNameDetected: detectedCollege,
    xiCount,
    xiiCount,
    errors,
  };
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
  dailyLimit = 100,
): Promise<{ batch: CollegeInviteBatch; sentCount: number; queuedCount: number }> {
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

  // Branded SMTP mail only — never inviteUserByEmail / OTP (Google Auth only).
  for (const rec of newRecords) {
    if (rec.status !== "sent") continue;
    const delivered = await sendCollegeStudentInviteEmail({
      email: rec.email,
      name: rec.name || rec.email.split("@")[0],
      collegeName: rec.collegeName,
      studentCode: rec.studentCode,
    });
    if (!delivered) {
      await supabase
        .from("edudeca_student_invitations")
        .update({
          notes: "Invite row saved; email delivery failed or SMTP not configured.",
        })
        .eq("id", rec.id);
    }
  }

  return { batch, sentCount, queuedCount };
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
  dailyLimit = 100,
): Promise<number> {
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
  if (rows.length === 0) return 0;

  const nowIso = new Date().toISOString();
  let count = 0;

  for (const row of rows) {
    const invite = mapInviteRow(row as Record<string, unknown>);
    const delivered = await sendCollegeStudentInviteEmail({
      email: invite.email,
      name: invite.name || invite.email.split("@")[0],
      collegeName: invite.collegeName,
      studentCode: invite.studentCode,
    });

    const { error: upErr } = await supabase
      .from("edudeca_student_invitations")
      .update({
        status: "sent",
        invited_at: nowIso,
        notes: delivered
          ? "Dispatched via admin daily quota release."
          : "Dispatched status set; email delivery failed or SMTP not configured.",
      })
      .eq("id", invite.id);
    if (upErr) {
      console.error("[invitations] dispatch update failed", upErr.message);
      continue;
    }
    count++;
  }

  const batchIds = [...new Set(rows.map((r) => String(r.batch_id)))];
  for (const id of batchIds) {
    await refreshBatchCounts(supabase, id);
  }
  return count;
}

export async function resendSingleInvite(
  supabase: SupabaseClient,
  inviteId: string,
): Promise<StudentInviteRecord | null> {
  const { data, error } = await supabase
    .from("edudeca_student_invitations")
    .select("*")
    .eq("id", inviteId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const invite = mapInviteRow(data as Record<string, unknown>);
  const delivered = await sendCollegeStudentInviteEmail({
    email: invite.email,
    name: invite.name || invite.email.split("@")[0],
    collegeName: invite.collegeName,
    studentCode: invite.studentCode,
  });

  const nowIso = new Date().toISOString();
  const { data: updated, error: upErr } = await supabase
    .from("edudeca_student_invitations")
    .update({
      status: invite.status === "joined" ? "joined" : "sent",
      invited_at: nowIso,
      notes: delivered
        ? "Resent invite email."
        : "Resend attempted; email delivery failed or SMTP not configured.",
    })
    .eq("id", inviteId)
    .select("*")
    .maybeSingle();

  if (upErr) throw new Error(upErr.message);
  if (updated) await refreshBatchCounts(supabase, invite.batchId);
  return updated ? mapInviteRow(updated as Record<string, unknown>) : invite;
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
