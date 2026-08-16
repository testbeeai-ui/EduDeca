import { NextResponse } from "next/server";

import {
  EDUDECA_PENDING_REF_COOKIE,
  normalizeEduDecaReferralCode,
} from "@/lib/referral/referral-code";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * Claim EduDeca referral attribution for the signed-in user using cookie or body.ref.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let bodyRef: string | null = null;
  try {
    const body = (await request.json()) as { ref?: unknown };
    if (typeof body.ref === "string") bodyRef = body.ref;
  } catch {
    /* optional body */
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${EDUDECA_PENDING_REF_COOKIE}=`));
  const cookieRaw = match
    ? decodeURIComponent(match.split("=").slice(1).join("="))
    : "";

  const code =
    normalizeEduDecaReferralCode(bodyRef) ??
    normalizeEduDecaReferralCode(cookieRaw);

  if (!code) {
    return NextResponse.json({ ok: false, reason: "no_pending_ref" });
  }

  const { data, error } = await supabase.rpc("claim_edudeca_referral_attribution", {
    p_ref_code: code,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const res = NextResponse.json({ result: data });
  res.cookies.set(EDUDECA_PENDING_REF_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
