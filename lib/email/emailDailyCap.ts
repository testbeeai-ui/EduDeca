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
