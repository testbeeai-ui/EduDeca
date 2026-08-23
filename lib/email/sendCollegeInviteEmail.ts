import "server-only";

import { generateCollegeInviteEmailHtml } from "@/lib/email/collegeInviteEmailTemplate";
import {
  isInviteEmailConfigured,
  sendTransactionalEmail,
} from "@/lib/email/sendTransactionalEmail";
import { EDUDECA_PUBLIC_SIGNIN_URL } from "@/lib/admin/invite-types";

function resolveJoinUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_EDUDECA_APP_URL?.trim();
  if (fromEnv) return `${fromEnv.replace(/\/$/, "")}/signin`;
  return EDUDECA_PUBLIC_SIGNIN_URL;
}

/**
 * Branded college invite email. Does NOT create Auth users —
 * students must Continue with Google on the join URL.
 */
export async function sendCollegeStudentInviteEmail(params: {
  email: string;
  name: string;
  collegeName: string;
  studentCode?: string | null;
}): Promise<boolean> {
  if (!isInviteEmailConfigured()) {
    console.warn("[edudeca invite] Email not configured — skipping send", {
      email: params.email,
    });
    return false;
  }

  const joinUrl = resolveJoinUrl();
  const html = generateCollegeInviteEmailHtml({
    name: params.name,
    collegeName: params.collegeName,
    studentCode: params.studentCode,
    joinUrl,
  });
  const text = [
    `Welcome, ${params.name}!`,
    `${params.collegeName} nominated you for EduDeca.`,
    `Activate your profile: ${joinUrl}`,
  ].join("\n");

  const result = await sendTransactionalEmail({
    to: params.email,
    subject: `You're invited to EduDeca — ${params.collegeName}`,
    html,
    text,
    log: { kind: "edudeca_invite" },
  });

  if (!result.ok) {
    console.error("[edudeca invite] send failed:", result.error, {
      email: params.email,
    });
    return false;
  }
  return true;
}
