import { NextResponse } from "next/server";

import {
  avatarColorForId,
  buildEduDecaShareUrl,
  initialsFromName,
  normalizeEduDecaReferralCode,
} from "@/lib/referral/referral-code";
import { requireApiUser } from "@/lib/supabase/require-user";

type ListRow = {
  attribution_id: string;
  referee_user_id: string;
  referee_name: string;
  credited_at: string;
};

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { supabase } = auth;

  const { data: minted, error: mintError } = await supabase.rpc(
    "ensure_my_edudeca_referral_code",
  );
  if (mintError) {
    return NextResponse.json({ error: mintError.message }, { status: 500 });
  }

  const code =
    typeof minted === "string" ? normalizeEduDecaReferralCode(minted) : null;

  const { data: rows, error } = await supabase.rpc("list_my_edudeca_referrals", {
    p_limit: 100,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const shareUrl = code ? buildEduDecaShareUrl(origin, code) : `${origin}/join`;

  const list = (rows ?? []) as ListRow[];
  const entries = list.map((r) => {
    const name = r.referee_name?.trim() || "Student";
    return {
      id: r.attribution_id,
      refereeUserId: r.referee_user_id,
      name,
      initials: initialsFromName(name),
      avatarColor: avatarColorForId(r.referee_user_id),
      creditedAt: r.credited_at,
    };
  });

  return NextResponse.json({
    code,
    shareUrl,
    count: entries.length,
    entries,
  });
}
