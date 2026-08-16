import { NextResponse } from "next/server";

import {
  EDUDECA_PENDING_REF_COOKIE,
  normalizeEduDecaReferralCode,
} from "@/lib/referral/referral-code";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 14; // 14 days

/** POST { ref } — store pending referral code cookie. DELETE — clear it. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw =
    body && typeof body === "object" && "ref" in body
      ? String((body as { ref?: unknown }).ref ?? "")
      : "";
  const normalized = normalizeEduDecaReferralCode(raw);
  if (!normalized) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true, ref: normalized });
  res.cookies.set(EDUDECA_PENDING_REF_COOKIE, normalized, {
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(EDUDECA_PENDING_REF_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${EDUDECA_PENDING_REF_COOKIE}=`));
  const raw = match ? decodeURIComponent(match.split("=").slice(1).join("=")) : "";
  const ref = normalizeEduDecaReferralCode(raw);
  return NextResponse.json({ ref });
}
