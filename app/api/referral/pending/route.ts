import { NextResponse } from "next/server";

import {
  EDUDECA_PENDING_REF_COOKIE,
  normalizeEduDecaReferralCode,
} from "@/lib/referral/referral-code";
import { createSupabaseServer } from "@/lib/supabase/server";

const COOKIE = {
  path: "/",
  sameSite: "lax" as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

function refFromCookie(request: Request) {
  const match = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${EDUDECA_PENDING_REF_COOKIE}=`));
  return normalizeEduDecaReferralCode(
    match ? decodeURIComponent(match.split("=").slice(1).join("=")) : "",
  );
}

async function referrerName(code: string) {
  try {
    const supabase = await createSupabaseServer();
    const { data } = await supabase.rpc("lookup_edudeca_referrer_preview", {
      p_ref_code: code,
    });
    const name = (data as { name?: string } | null)?.name?.trim();
    return name || null;
  } catch {
    return null;
  }
}

/** POST { ref } — store pending referral cookie and return referrer name. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const ref = normalizeEduDecaReferralCode(
    body && typeof body === "object" && "ref" in body
      ? String((body as { ref?: unknown }).ref ?? "")
      : "",
  );
  if (!ref) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
  }

  const name = await referrerName(ref);
  const res = NextResponse.json({ ok: true, ref, name, found: Boolean(name) });
  res.cookies.set(EDUDECA_PENDING_REF_COOKIE, ref, {
    ...COOKIE,
    maxAge: 60 * 60 * 24 * 14,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(EDUDECA_PENDING_REF_COOKIE, "", { ...COOKIE, maxAge: 0 });
  return res;
}

export async function GET(request: Request) {
  const ref = refFromCookie(request);
  if (!ref) return NextResponse.json({ ref: null, name: null, found: false });
  const name = await referrerName(ref);
  return NextResponse.json({ ref, name, found: Boolean(name) });
}
