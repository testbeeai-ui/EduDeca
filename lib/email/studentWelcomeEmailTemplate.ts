import { applyEmailTemplate, escapeHtml } from "@/lib/email/applyEmailTemplate";
import { STUDENT_WELCOME_HTML_TEMPLATE } from "@/lib/email/templates/studentWelcome.html";

/** EduBlast CDN logo — allowed asset host; product CTA stays on EduDeca. */
export const EDUBLAST_EMAIL_LOGO_URL =
  "https://www.edublast.in/images/logo-2.png";

export const DEFAULT_EDUBITE_URL = "https://www.edubite.com";

export type StudentWelcomeParams = {
  email: string;
  displayName?: string;
  ctaUrl: string;
  logoUrl?: string;
  edubiteUrl?: string;
};

/** First token of the email local part, title-cased (e.g. priya.sharma → Priya). */
export function displayNameFromEmail(email: string): string {
  const local = email.trim().split("@")[0] ?? "";
  const token = local.split(/[._+-]/).find((part) => part.length > 0) ?? "";
  if (!token) return "there";
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

export function buildStudentWelcomeEmail(params: StudentWelcomeParams): {
  subject: string;
  html: string;
  text: string;
} {
  const name = (
    params.displayName?.trim() ||
    displayNameFromEmail(params.email) ||
    "there"
  ).trim();
  const year = String(new Date().getFullYear());
  const ctaUrl = params.ctaUrl.trim();
  const logoUrl = (params.logoUrl?.trim() || EDUBLAST_EMAIL_LOGO_URL).replace(
    /\/$/,
    "",
  );
  const edubiteUrl = (params.edubiteUrl?.trim() || DEFAULT_EDUBITE_URL).replace(
    /\/$/,
    "",
  );

  const html = applyEmailTemplate(STUDENT_WELCOME_HTML_TEMPLATE, {
    name: escapeHtml(name),
    ctaUrl: escapeHtml(ctaUrl),
    logoUrl: escapeHtml(logoUrl),
    year: escapeHtml(year),
    edubiteUrl: escapeHtml(edubiteUrl),
  });

  const text = [
    `Welcome aboard, ${name}`,
    "",
    "You're registered for EduDeca.",
    "",
    "Welcome to the EduDeca Academic Decathlon Challenge. We shall send you an email as soon as the competition window for Levels 1–2 gets open.",
    "",
    "Proceed to EduDeca (www.edudeca.com) or contact admin@edudeca.com should you have any queries.",
    "",
    "WHAT'S NEXT",
    "Keep an eye on your inbox regularly — we'll let you know the moment Levels 1–2 go live. Also, keep checking your spam folder just in case.",
    "",
    `Meanwhile, you may like to use our EduBite site (${edubiteUrl}) for building everyday consistency, along with quick daily brain workouts.`,
    "",
    "Continue to EduDeca:",
    ctaUrl,
    "",
    "Questions? admin@edudeca.com",
    "",
    "— EduBlast",
    `© ${year} EduBlast · edudeca.com`,
  ].join("\n");

  return {
    subject: `Welcome to EduDeca, ${name}`,
    html,
    text,
  };
}
