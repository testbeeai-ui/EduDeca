import "server-only";

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

import {
  checkSharedEmailDailyCap,
  logTransactionalEmail,
  type TransactionalEmailKind,
} from "@/lib/email/sharedEmailQuota";

type EmailEnv = {
  host: string;
  port: number;
  user: string;
  pass: string;
};

function readEmailEnv(): EmailEnv | null {
  const host = process.env.EMAIL_SERVER_HOST?.trim();
  const portRaw = process.env.EMAIL_SERVER_PORT?.trim();
  const user = process.env.EMAIL_SERVER_USER?.trim();
  const pass = process.env.EMAIL_SERVER_PASSWORD?.trim().replace(/\s+/g, "");
  if (!host || !portRaw || !user || !pass) return null;
  const port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) return null;
  return { host, port, user, pass };
}

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter;
  const env = readEmailEnv();
  if (!env) return null;
  cachedTransporter = nodemailer.createTransport({
    host: env.host,
    port: env.port,
    secure: env.port === 465,
    auth: { user: env.user, pass: env.pass },
  });
  return cachedTransporter;
}

export function isInviteEmailConfigured(): boolean {
  return readEmailEnv() !== null;
}

function fromHeader(): string | null {
  const addr = process.env.EMAIL_SERVER_USER?.trim();
  if (!addr) return null;
  const name = (process.env.EMAIL_FROM_NAME?.trim() || "EduDeca").replace(/"/g, "");
  return `"${name}" <${addr}>`;
}

/**
 * SMTP send with the same IST daily cap + transactional_email_logs as EduBlast.
 */
export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  log?: {
    kind: TransactionalEmailKind;
    userId?: string | null;
  };
}): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  const transporter = getTransporter();
  const from = fromHeader();
  if (!transporter || !from) {
    return { ok: false, error: "Email not configured" };
  }

  const to = params.to.trim();
  if (!to) return { ok: false, error: "Recipient address is required" };

  if (params.log) {
    const capError = await checkSharedEmailDailyCap();
    if (capError) {
      await logTransactionalEmail({
        kind: params.log.kind,
        recipient: to,
        subject: params.subject,
        status: "blocked_cap",
        userId: params.log.userId,
        errorMessage: capError,
      });
      return { ok: false, error: capError };
    }
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    const messageId = String(info.messageId || "");
    if (params.log) {
      const logged = await logTransactionalEmail({
        kind: params.log.kind,
        recipient: to,
        subject: params.subject,
        status: "sent",
        userId: params.log.userId,
        messageId,
      });
      if (!logged) {
        return {
          ok: false,
          error:
            "Email may have been delivered, but shared quota log failed (transactional_email_logs). Check SUPABASE_SERVICE_ROLE_KEY.",
        };
      }
    }
    return { ok: true, messageId };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (params.log) {
      await logTransactionalEmail({
        kind: params.log.kind,
        recipient: to,
        subject: params.subject,
        status: "failed",
        userId: params.log.userId,
        errorMessage: message,
      });
    }
    return { ok: false, error: message };
  }
}
