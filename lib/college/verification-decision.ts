/**
 * Pure verification decision helpers (testable seams).
 * No Supabase / UI side effects.
 */

export type VerificationAction = "approve" | "reject" | "comment";

export const ADMIN_FEEDBACK_MAX_CHARS = 2000;

export function normalizeAdminFeedback(
  comment: string | null | undefined,
): string | null {
  if (comment == null) return null;
  const trimmed = comment.trim().replace(/\r\n/g, "\n");
  if (!trimmed) return null;
  if (trimmed.length > ADMIN_FEEDBACK_MAX_CHARS) {
    return trimmed.slice(0, ADMIN_FEEDBACK_MAX_CHARS);
  }
  return trimmed;
}

export type VerificationDecision = {
  status?: "approved" | "rejected";
  verifiedAt?: string | null;
  rejectedAt?: string | null;
  adminFeedback?: string | null;
  adminFeedbackAt?: string | null;
};

/**
 * Builds the fields to persist for an admin verification action.
 * `comment` action updates feedback only (status unchanged).
 */
export function buildVerificationDecision(input: {
  action: VerificationAction;
  comment?: string | null;
  nowIso?: string;
}): VerificationDecision {
  const now = input.nowIso ?? new Date().toISOString();
  const feedback = normalizeAdminFeedback(input.comment);

  switch (input.action) {
    case "approve": {
      const out: VerificationDecision = {
        status: "approved",
        verifiedAt: now,
        rejectedAt: null,
      };
      if (feedback) {
        out.adminFeedback = feedback;
        out.adminFeedbackAt = now;
      }
      return out;
    }
    case "reject": {
      const out: VerificationDecision = {
        status: "rejected",
        verifiedAt: null,
        rejectedAt: now,
      };
      if (feedback) {
        out.adminFeedback = feedback;
        out.adminFeedbackAt = now;
      }
      return out;
    }
    case "comment": {
      if (!feedback) {
        throw new Error("Comment text is required");
      }
      return {
        adminFeedback: feedback,
        adminFeedbackAt: now,
      };
    }
    default: {
      const _exhaustive: never = input.action;
      throw new Error(`Unknown verification action: ${String(_exhaustive)}`);
    }
  }
}
