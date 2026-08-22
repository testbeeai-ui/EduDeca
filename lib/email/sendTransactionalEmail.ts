import "server-only";

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

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

export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  const transporter = getTransporter();
  const from = fromHeader();
  if (!transporter || !from) {
    return { ok: false, error: "Email not configured" };
  }
  try {
    const info = await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    return { ok: true, messageId: String(info.messageId || "") };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}
