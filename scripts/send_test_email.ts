/**
 * Manual smoke script: send one branded college invite (SMTP).
 * Does NOT create Auth users — Google sign-in only.
 *
 * Run from EduDeca/: npx tsx --env-file=.env scripts/send_test_email.ts
 */
import { sendCollegeStudentInviteEmail } from "../lib/email/sendCollegeInviteEmail";

async function main() {
  const recipient = process.env.EMAIL_ADMIN?.trim() || "michaelkillgta@gmail.com";
  console.log(`[EduDeca] Dispatching branded student invitation to ${recipient}...`);

  const ok = await sendCollegeStudentInviteEmail({
    email: recipient,
    name: "Michael Admin",
    collegeName: "Vishwa College",
    studentCode: "VSH-2026-TEST",
  });

  if (!ok) {
    console.error("[EduDeca] Invite email failed (check EMAIL_SERVER_* env).");
    process.exit(1);
  }
  console.log("[EduDeca] SUCCESS! Invite email dispatched to:", recipient);
}

main();
