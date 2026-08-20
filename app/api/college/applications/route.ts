import { NextResponse } from "next/server";

import { isTesterInvestorEmail } from "@/lib/admin/tester-allowlist";
import {
  getCollegeApplicationForUser,
  listPendingCollegeApplications,
  upsertCollegeApplication,
  verifyCollegeApplication,
} from "@/lib/college/registry-store";
import {
  emptyCollegeRegistrationDraft,
  type CollegeRegistrationDraft,
} from "@/lib/college/registration";
import { createSupabaseServer } from "@/lib/supabase/server";

function isCollegeApplicationPayloadReady(draft: CollegeRegistrationDraft): boolean {
  const required = [
    draft.institutionName.trim(),
    draft.state.trim(),
    draft.city.trim(),
    draft.xiCount,
    draft.xiiCount,
    draft.principalName.trim(),
    draft.principalMobile.trim(),
    draft.principalEmail.trim(),
    draft.contactName.trim(),
    draft.contactMobile.trim(),
    draft.contactEmail.trim(),
  ];
  return required.every((v) => v !== "") && draft.pledge === true;
}

async function requireUser() {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { user: data.user, supabase };
}

export async function GET() {
  const auth = await requireUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user } = auth;

  if (isTesterInvestorEmail(user.email)) {
    const pending = await listPendingCollegeApplications();
    const application = await getCollegeApplicationForUser(user.id);
    return NextResponse.json({ pending, application });
  }

  const application = await getCollegeApplicationForUser(user.id);
  return NextResponse.json({ application });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user, supabase } = auth;

  let body: { draft?: Partial<CollegeRegistrationDraft> };
  try {
    body = (await request.json()) as { draft?: Partial<CollegeRegistrationDraft> };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const draft: CollegeRegistrationDraft = {
    ...emptyCollegeRegistrationDraft(),
    ...(body.draft ?? {}),
  };

  if (!isCollegeApplicationPayloadReady(draft)) {
    return NextResponse.json(
      { error: "Complete all required college registration fields" },
      { status: 400 },
    );
  }

  const application = await upsertCollegeApplication({
    userId: user.id,
    email: user.email ?? null,
    draft,
  });

  // Persist identity fields onto existing edudeca_profiles columns (no schema change).
  await supabase.from("edudeca_profiles").upsert(
    {
      id: user.id,
      institution_name: draft.institutionName.trim(),
      state: draft.state.trim() || null,
      city: draft.city.trim() || null,
      email: user.email?.trim() || null,
    },
    { onConflict: "id" },
  );

  return NextResponse.json({ application });
}

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user } = auth;
  if (!isTesterInvestorEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { applicationId?: string; action?: string };
  try {
    body = (await request.json()) as { applicationId?: string; action?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action !== "verify" || !body.applicationId?.trim()) {
    return NextResponse.json({ error: "Invalid verify payload" }, { status: 400 });
  }

  const application = await verifyCollegeApplication(body.applicationId.trim());
  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ application });
}
