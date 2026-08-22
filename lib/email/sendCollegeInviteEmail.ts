import "server-only";

import { generateCollegeInviteEmailHtml } from "@/lib/email/collegeInviteEmailTemplate";
import {
  isInviteEmailConfigured,
  sendTransactionalEmail,
} from "@/lib/email/sendTransactionalEmail";

function resolveJoinUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_EDUDECA_APP_URL?.trim();
  if (fromEnv) return `${fromEnv.replace(/\/$/, "")}/signin`;
  return "https://edudeca.com/signin";
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
  });

  if (!result.ok) {
    console.error("[edudeca invite] send failed:", result.error, {
      email: params.email,
    });
    return false;
  }
  return true;
}
