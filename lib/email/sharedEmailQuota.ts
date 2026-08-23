import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  getEmailDailySendCap,
  getIstCalendarDateIso,
} from "@/lib/email/emailDailyCap";

export {
  DEFAULT_EMAIL_DAILY_SEND_CAP,
  getEmailDailySendCap,
  getIstCalendarDateIso,
} from "@/lib/email/emailDailyCap";

export type SharedEmailQuota = {
  dailyLimit: number;
  sentToday: number;
  remainingToday: number;
  istDate: string;
};

export type TransactionalEmailKind =
  | "welcome"
  | "login"
  | "approval"
  | "edudeca_invite"
  | "other";

export type TransactionalEmailStatus = "sent" | "failed" | "blocked_cap";

export function createEmailAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function countSentEmailsForIstDate(
  istDate: string,
): Promise<number> {
  const admin = createEmailAdminClient();
  if (!admin) return 0;

  const { count, error } = await admin
    .from("transactional_email_logs")
    .select("id", { count: "exact", head: true })
    .eq("ist_date", istDate)
    .eq("status", "sent");

  if (error) {
    console.warn("[email-quota] count failed:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function getSharedEmailQuota(
  nowMs = Date.now(),
): Promise<SharedEmailQuota> {
  const dailyLimit = getEmailDailySendCap();
  const istDate = getIstCalendarDateIso(nowMs);
  const sentToday = await countSentEmailsForIstDate(istDate);
  return {
    dailyLimit,
    sentToday,
    remainingToday: Math.max(0, dailyLimit - sentToday),
    istDate,
  };
}

/** null = under cap; string = block reason. */
export async function checkSharedEmailDailyCap(
  nowMs = Date.now(),
): Promise<string | null> {
  const q = await getSharedEmailQuota(nowMs);
  if (q.sentToday >= q.dailyLimit) {
    return `Daily email cap reached (${q.sentToday}/${q.dailyLimit} sent today IST). Shared across EduBlast + EduDeca.`;
  }
  return null;
}

export async function logTransactionalEmail(input: {
  kind: TransactionalEmailKind;
  recipient: string;
  subject: string;
  status: TransactionalEmailStatus;
  userId?: string | null;
  messageId?: string | null;
  errorMessage?: string | null;
  nowMs?: number;
}): Promise<boolean> {
  const admin = createEmailAdminClient();
  if (!admin) {
    console.warn("[email-quota] service role missing — skip transactional log");
    return false;
  }

  const istDate = getIstCalendarDateIso(input.nowMs ?? Date.now());
  const { error } = await admin.from("transactional_email_logs").insert({
    ist_date: istDate,
    kind: input.kind,
    recipient: input.recipient.trim(),
    user_id: input.userId ?? null,
    subject: input.subject.trim(),
    status: input.status,
    message_id: input.messageId ?? null,
    error_message: input.errorMessage ?? null,
  });

  if (error) {
    console.warn("[email-quota] log insert failed:", error.message);
    return false;
  }
  return true;
}
