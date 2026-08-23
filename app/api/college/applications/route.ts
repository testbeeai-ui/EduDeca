import { NextResponse } from "next/server";

import { isTesterInvestorEmail } from "@/lib/admin/tester-allowlist";
import {
  attachCollegeUploadPaths,
  decideCollegeApplication,
  getCollegeApplicationForUser,
  listAllCollegeApplicationsForAdmin,
  listPendingCollegeApplications,
  upsertCollegeApplication,
} from "@/lib/college/registry-store";
import type { VerificationAction } from "@/lib/college/verification-decision";
import {
  emptyCollegeRegistrationDraft,
  type CollegeRegistrationDraft,
} from "@/lib/college/registration";
import { saveCollegeUploadFile } from "@/lib/college/upload-store";
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

async function parseApplicationPost(request: Request): Promise<{
  draft: CollegeRegistrationDraft;
  xiFile: File | null;
  xiiFile: File | null;
}> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const rawDraft = form.get("draft");
    let partial: Partial<CollegeRegistrationDraft> = {};
    if (typeof rawDraft === "string") {
      try {
        partial = JSON.parse(rawDraft) as Partial<CollegeRegistrationDraft>;
      } catch {
        partial = {};
      }
    }
    const xi = form.get("xiFile");
    const xii = form.get("xiiFile");
    return {
      draft: { ...emptyCollegeRegistrationDraft(), ...partial },
      xiFile: xi instanceof File && xi.size > 0 ? xi : null,
      xiiFile: xii instanceof File && xii.size > 0 ? xii : null,
    };
  }

  const body = (await request.json()) as { draft?: Partial<CollegeRegistrationDraft> };
  return {
    draft: { ...emptyCollegeRegistrationDraft(), ...(body.draft ?? {}) },
    xiFile: null,
    xiiFile: null,
  };
}

export async function GET() {
  const auth = await requireUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user } = auth;

  if (isTesterInvestorEmail(user.email)) {
    const pending = await listPendingCollegeApplications();
    const applications = await listAllCollegeApplicationsForAdmin();
    const application = await getCollegeApplicationForUser(user.id);
    return NextResponse.json({ pending, applications, application });
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

  let parsed: Awaited<ReturnType<typeof parseApplicationPost>>;
  try {
    parsed = await parseApplicationPost(request);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { draft, xiFile, xiiFile } = parsed;

  if (!isCollegeApplicationPayloadReady(draft)) {
    return NextResponse.json(
      { error: "Complete all required college registration fields" },
      { status: 400 },
    );
  }

  if (xiFile && !draft.xiFileName) {
    draft.xiFileName = xiFile.name;
  }
  if (xiiFile && !draft.xiiFileName) {
    draft.xiiFileName = xiiFile.name;
  }

  let application;
  try {
    application = await upsertCollegeApplication({
      userId: user.id,
      email: user.email ?? null,
      draft,
    });
  } catch (err) {
    console.error("[college] upsert failed", err);
    return NextResponse.json(
      { error: "Could not save college application" },
      { status: 500 },
    );
  }

  try {
    const xiSaved = xiFile
      ? await saveCollegeUploadFile({
          userId: user.id,
          kind: "xi",
          originalFileName: xiFile.name,
          bytes: Buffer.from(await xiFile.arrayBuffer()),
        })
      : null;
    const xiiSaved = xiiFile
      ? await saveCollegeUploadFile({
          userId: user.id,
          kind: "xii",
          originalFileName: xiiFile.name,
          bytes: Buffer.from(await xiiFile.arrayBuffer()),
        })
      : null;

    if (xiSaved || xiiSaved) {
      const updated = await attachCollegeUploadPaths({
        applicationId: application.id,
        xi: xiSaved
          ? { fileName: xiSaved.originalFileName, storedRelPath: xiSaved.storedRelPath }
          : null,
        xii: xiiSaved
          ? { fileName: xiiSaved.originalFileName, storedRelPath: xiiSaved.storedRelPath }
          : null,
      });
      if (updated) application = updated;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save uploaded files";
    const status =
      typeof err === "object" && err && "status" in err && typeof (err as { status: unknown }).status === "number"
        ? (err as { status: number }).status
        : 500;
    return NextResponse.json({ error: message, application }, { status });
  }

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

  let body: { applicationId?: string; action?: string; comment?: string };
  try {
    body = (await request.json()) as {
      applicationId?: string;
      action?: string;
      comment?: string;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.applicationId?.trim() || !body.action) {
    return NextResponse.json({ error: "Invalid verification payload" }, { status: 400 });
  }

  const rawAction = body.action.trim().toLowerCase();
  let action: VerificationAction;
  if (rawAction === "verify" || rawAction === "approve") {
    action = "approve";
  } else if (rawAction === "reject") {
    action = "reject";
  } else if (rawAction === "comment") {
    action = "comment";
  } else {
    return NextResponse.json(
      { error: "action must be approve, reject, or comment" },
      { status: 400 },
    );
  }

  const result = await decideCollegeApplication(
    body.applicationId.trim(),
    action,
    body.comment,
  );
  if (!result.ok) {
    if (result.error === "invalid_comment") {
      return NextResponse.json(
        { error: "Comment text is required" },
        { status: 400 },
      );
    }
    if (result.error === "not_found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ application: result.application });
}
