/**
 * Pure invite-dispatch helpers (testable seams).
 * No Supabase / email / Auth side effects.
 */

export type InviteDispatchStatus = "sent" | "queued_tomorrow";

export function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** First `dailyLimit` rows are sent today; the rest queue for tomorrow. */
export function planInviteStatuses(
  recordCount: number,
  dailyLimit: number,
): InviteDispatchStatus[] {
  const limit = Number.isFinite(dailyLimit) ? Math.max(0, Math.floor(dailyLimit)) : 0;
  const count = Number.isFinite(recordCount) ? Math.max(0, Math.floor(recordCount)) : 0;
  const out: InviteDispatchStatus[] = [];
  for (let i = 0; i < count; i++) {
    out.push(i < limit ? "sent" : "queued_tomorrow");
  }
  return out;
}

export function countPlannedStatuses(statuses: InviteDispatchStatus[]): {
  sentCount: number;
  queuedCount: number;
} {
  let sentCount = 0;
  let queuedCount = 0;
  for (const s of statuses) {
    if (s === "sent") sentCount++;
    else queuedCount++;
  }
  return { sentCount, queuedCount };
}
