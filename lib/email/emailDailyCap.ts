/** Same default as EduBlast Web (`lib/email/emailDailyCap.ts`). */
export const DEFAULT_EMAIL_DAILY_SEND_CAP = 500;

export function getEmailDailySendCap(): number {
  const raw = process.env.EMAIL_DAILY_SEND_CAP?.trim();
  if (!raw) return DEFAULT_EMAIL_DAILY_SEND_CAP;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_EMAIL_DAILY_SEND_CAP;
  return Math.floor(n);
}

/** Asia/Kolkata calendar date `YYYY-MM-DD` (matches EduBlast logging). */
export function getIstCalendarDateIso(nowMs = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
    new Date(nowMs),
  );
}

/**
 * Fail-closed quota math: an unknown sent count consumes the entire daily budget
 * so callers cannot send while transactional_email_logs is unreadable.
 */
export function resolveSharedEmailQuotaCounts(
  dailyLimit: number,
  sentToday: number | null,
): { sentToday: number; remainingToday: number } {
  if (sentToday === null) {
    return { sentToday: dailyLimit, remainingToday: 0 };
  }
  return {
    sentToday,
    remainingToday: Math.max(0, dailyLimit - sentToday),
  };
}
