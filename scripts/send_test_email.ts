/**
 * Manual smoke script: send one branded college invite (SMTP).
 * Does NOT create Auth users — Google sign-in only.
 *
 * Run from EduDeca/: npx tsx --env-file=.env scripts/send_test_email.ts
 */
import nodemailer from "nodemailer";

import { generateCollegeInviteEmailHtml } from "../lib/email/collegeInviteEmailTemplate";
import { EDUDECA_PUBLIC_SIGNIN_URL } from "../lib/admin/invite-types";

async function main() {
  const recipient =
    process.env.EMAIL_ADMIN?.trim() || "michaelkillgta@gmail.com";
  const host = process.env.EMAIL_SERVER_HOST?.trim();
  const portRaw = process.env.EMAIL_SERVER_PORT?.trim();
  const user = process.env.EMAIL_SERVER_USER?.trim();
  const pass = process.env.EMAIL_SERVER_PASSWORD?.trim().replace(/\s+/g, "");
  const fromName = (process.env.EMAIL_FROM_NAME?.trim() || "EduDeca").replace(
    /"/g,
    "",
  );

  if (!host || !portRaw || !user || !pass) {
    console.error("[EduDeca] Missing EMAIL_SERVER_* env — cannot send.");
    process.exit(1);
  }

  const port = Number(portRaw);
  const joinUrl = EDUDECA_PUBLIC_SIGNIN_URL;
  const html = generateCollegeInviteEmailHtml({
    name: "Michael Admin",
    collegeName: "Vishwa College",
    studentCode: "VSH-2026-TEST",
    joinUrl,
  });
  const text = [
    "Welcome, Michael Admin!",
    "Vishwa College nominated you for EduDeca.",
    `Activate your profile: ${joinUrl}`,
  ].join("\n");

  console.log(`[EduDeca] Dispatching branded student invitation to ${recipient}...`);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const info = await transporter.sendMail({
    from: `"${fromName}" <${user}>`,
    to: recipient,
    subject: "You're invited to EduDeca — Vishwa College",
    html,
    text,
  });

  console.log("[EduDeca] SUCCESS! Invite email dispatched to:", recipient);
  console.log("[EduDeca] messageId:", info.messageId);
}

main().catch((e) => {
  console.error("[EduDeca] Invite email failed:", e);
  process.exit(1);
});
