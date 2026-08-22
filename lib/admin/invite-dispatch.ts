/**
 * Pure invite-dispatch helpers (testable seams).
 * No Supabase / email / Auth side effects.
 */

export type InviteDispatchStatus = "sent" | "queued_tomorrow";

export type InviteLifecycleStatus =
  | "joined"
  | "sent"
  | "queued_tomorrow"
  | "pending";

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

/**
 * If the invite email already exists on EduDeca, status is DONE (joined).
 * Otherwise keep the stored invite lifecycle status.
 */
export function resolveInviteStatusForRegistration(
  status: InviteLifecycleStatus,
  emailIsRegisteredOnEduDeca: boolean,
): InviteLifecycleStatus {
  if (emailIsRegisteredOnEduDeca) return "joined";
  return status;
}

/** Admin roster badge copy for invite status. */
export function inviteStatusBadgeLabel(status: InviteLifecycleStatus): string {
  switch (status) {
    case "joined":
      return "DONE";
    case "sent":
      return "Email Sent";
    case "queued_tomorrow":
      return "Queued for Tomorrow";
    case "pending":
      return "Pending";
    default: {
      const _never: never = status;
      return _never;
    }
  }
}
