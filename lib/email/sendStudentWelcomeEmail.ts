import "server-only";

import { EDUDECA_PUBLIC_SIGNIN_URL } from "@/lib/admin/invite-types";
import { buildStudentWelcomeEmail } from "@/lib/email/studentWelcomeEmailTemplate";
import {
  isInviteEmailConfigured,
  sendTransactionalEmail,
} from "@/lib/email/sendTransactionalEmail";

function resolveWelcomeCtaUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_EDUDECA_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return EDUDECA_PUBLIC_SIGNIN_URL.replace(/\/signin\/?$/, "");
}

/**
 * Welcome email after an individual student registers interest in EduDeca.
 * Does not throw — logs and returns false on failure.
 */
export async function sendStudentWelcomeEmail(params: {
  email: string;
  displayName?: string;
  userId?: string | null;
}): Promise<boolean> {
  if (!isInviteEmailConfigured()) {
    console.warn("[edudeca welcome] Email not configured — skipping send");
    return false;
  }

  const { subject, html, text } = buildStudentWelcomeEmail({
    email: params.email,
    displayName: params.displayName,
    ctaUrl: resolveWelcomeCtaUrl(),
  });

  const result = await sendTransactionalEmail({
    to: params.email,
    subject,
    html,
    text,
    log: { kind: "welcome", userId: params.userId ?? null },
  });

  if (!result.ok) {
    console.error("[edudeca welcome] send failed:", result.error, {
      email: params.email,
    });
    return false;
  }
  return true;
}
