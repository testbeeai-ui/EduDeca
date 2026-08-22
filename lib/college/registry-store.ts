import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeInstitutionName } from "@/lib/college/normalize-institution";
import type { CollegeRegistrationDraft } from "@/lib/college/registration";
import {
  buildVerificationDecision,
  type VerificationAction,
} from "@/lib/college/verification-decision";
import { createSupabaseServer } from "@/lib/supabase/server";

export type CollegeApplicationStatus = "pending" | "approved" | "rejected";

export type CollegeApplication = {
  id: string;
  userId: string;
  email: string | null;
  status: CollegeApplicationStatus;
  submittedAt: string;
  verifiedAt: string | null;
  rejectedAt: string | null;
  adminFeedback: string | null;
  adminFeedbackAt: string | null;
  institutionName: string;
  state: string;
  city: string;
  xiCount: string;
  xiiCount: string;
  math: boolean;
  bio: boolean;
  principalName: string;
  principalMobile: string;
  principalEmail: string;
  contactName: string;
  contactMobile: string;
  contactEmail: string;
  pledge: boolean;
  xiFileName: string | null;
  xiiFileName: string | null;
  /** Relative path under data/college-uploads (admin download). */
  xiStoredRelPath: string | null;
  xiiStoredRelPath: string | null;
};

export type CollegeRosterStudent = {
  userId: string;
  displayName: string;
  studentCode: string | null;
  classLevel: 11 | 12 | null;
  campaignLevel: number;
  isProctoredPaid: boolean;
  lastChallengeDate: string | null;
  syncedAt: string;
};

export type CollegeApplicationAdminView = CollegeApplication & {
  roster: CollegeRosterStudent[];
};

type ApplicationRow = {
  id: string;
  user_id: string;
  email: string | null;
  status: string;
  submitted_at: string;
  verified_at: string | null;
  rejected_at: string | null;
  admin_feedback: string | null;
  admin_feedback_at: string | null;
  institution_name: string;
  institution_key: string;
  state: string;
  city: string;
  xi_count: string;
  xii_count: string;
  math: boolean;
  bio: boolean;
  principal_name: string;
  principal_mobile: string;
  principal_email: string;
  contact_name: string;
  contact_mobile: string;
  contact_email: string;
  pledge: boolean;
  xi_file_name: string | null;
  xii_file_name: string | null;
  xi_stored_rel_path: string | null;
  xii_stored_rel_path: string | null;
};

type RosterRow = {
  student_user_id: string;
  display_name: string;
  student_code: string | null;
  class_level: number | null;
  campaign_level: number;
  is_proctored_paid: boolean;
  last_challenge_date: string | null;
  synced_at: string;
  institution_key: string;
};

function asStatus(value: string): CollegeApplicationStatus {
  if (value === "approved" || value === "rejected" || value === "pending") return value;
  return "pending";
}

function rowToApplication(row: ApplicationRow): CollegeApplication {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    status: asStatus(row.status),
    submittedAt: row.submitted_at,
    verifiedAt: row.verified_at,
    rejectedAt: row.rejected_at ?? null,
    adminFeedback: row.admin_feedback ?? null,
    adminFeedbackAt: row.admin_feedback_at ?? null,
    institutionName: row.institution_name,
    state: row.state ?? "",
    city: row.city ?? "",
    xiCount: row.xi_count ?? "",
    xiiCount: row.xii_count ?? "",
    math: !!row.math,
    bio: !!row.bio,
    principalName: row.principal_name ?? "",
    principalMobile: row.principal_mobile ?? "",
    principalEmail: row.principal_email ?? "",
    contactName: row.contact_name ?? "",
    contactMobile: row.contact_mobile ?? "",
    contactEmail: row.contact_email ?? "",
    pledge: !!row.pledge,
    xiFileName: row.xi_file_name ?? null,
    xiiFileName: row.xii_file_name ?? null,
    xiStoredRelPath: row.xi_stored_rel_path ?? null,
    xiiStoredRelPath: row.xii_stored_rel_path ?? null,
  };
}

function rowToRoster(row: RosterRow): CollegeRosterStudent {
  const classLevel =
    row.class_level === 11 || row.class_level === 12 ? row.class_level : null;
  return {
    userId: row.student_user_id,
    displayName: row.display_name,
    studentCode: row.student_code,
    classLevel,
    campaignLevel: typeof row.campaign_level === "number" ? row.campaign_level : 1,
    isProctoredPaid: !!row.is_proctored_paid,
    lastChallengeDate: row.last_challenge_date,
    syncedAt: row.synced_at,
  };
}

export function draftToApplicationFields(draft: CollegeRegistrationDraft) {
  const institutionName = draft.institutionName.trim();
  return {
    institutionName,
    institutionKey: normalizeInstitutionName(institutionName),
    state: draft.state.trim(),
    city: draft.city.trim(),
    xiCount: draft.xiCount,
    xiiCount: draft.xiiCount,
    math: draft.math,
    bio: draft.bio,
    principalName: draft.principalName.trim(),
    principalMobile: draft.principalMobile.trim(),
    principalEmail: draft.principalEmail.trim(),
    contactName: draft.contactName.trim(),
    contactMobile: draft.contactMobile.trim(),
    contactEmail: draft.contactEmail.trim(),
    pledge: draft.pledge,
    xiFileName: draft.xiFileName?.trim() || null,
    xiiFileName: draft.xiiFileName?.trim() || null,
  };
}

function fieldsToInsert(
  userId: string,
  email: string | null,
  fields: ReturnType<typeof draftToApplicationFields>,
  extras: {
    status: CollegeApplicationStatus;
    submittedAt: string;
    verifiedAt: string | null;
    xiStoredRelPath: string | null;
    xiiStoredRelPath: string | null;
  },
) {
  return {
    user_id: userId,
    email,
    status: extras.status,
    submitted_at: extras.submittedAt,
    verified_at: extras.verifiedAt,
    institution_name: fields.institutionName,
    institution_key: fields.institutionKey,
    state: fields.state,
    city: fields.city,
    xi_count: fields.xiCount,
    xii_count: fields.xiiCount,
    math: fields.math,
    bio: fields.bio,
    principal_name: fields.principalName,
    principal_mobile: fields.principalMobile,
    principal_email: fields.principalEmail,
    contact_name: fields.contactName,
    contact_mobile: fields.contactMobile,
    contact_email: fields.contactEmail,
    pledge: fields.pledge,
    xi_file_name: fields.xiFileName,
    xii_file_name: fields.xiiFileName,
    xi_stored_rel_path: extras.xiStoredRelPath,
    xii_stored_rel_path: extras.xiiStoredRelPath,
  };
}

export async function upsertCollegeApplication(input: {
  userId: string;
  email: string | null;
  draft: CollegeRegistrationDraft;
}): Promise<CollegeApplication> {
  const supabase = await createSupabaseServer();
  const fields = draftToApplicationFields(input.draft);
  const existing = await getCollegeApplicationForUser(input.userId);

  if (existing) {
    const keepApproved = existing.status === "approved";
    // Approved identity is frozen for non-admins (roster matching key).
    const lockedFields = keepApproved
      ? {
          ...fields,
          institutionName: existing.institutionName,
          institutionKey: normalizeInstitutionName(existing.institutionName),
        }
      : fields;
    const nextStatus: CollegeApplicationStatus = keepApproved
      ? "approved"
      : existing.status === "rejected"
        ? "pending"
        : "pending";
    const payload = fieldsToInsert(input.userId, input.email, lockedFields, {
      status: nextStatus,
      submittedAt: keepApproved ? existing.submittedAt : new Date().toISOString(),
      verifiedAt: keepApproved ? existing.verifiedAt : null,
      xiStoredRelPath: existing.xiStoredRelPath,
      xiiStoredRelPath: existing.xiiStoredRelPath,
    });
    payload.xi_file_name = fields.xiFileName ?? existing.xiFileName;
    payload.xii_file_name = fields.xiiFileName ?? existing.xiiFileName;

    const { data, error } = await supabase
      .from("edudeca_college_applications")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error || !data) {
      console.error("[college] upsert update", error);
      throw error ?? new Error("Could not update college application");
    }
    return rowToApplication(data as ApplicationRow);
  }

  const insertPayload = fieldsToInsert(input.userId, input.email, fields, {
    status: "pending",
    submittedAt: new Date().toISOString(),
    verifiedAt: null,
    xiStoredRelPath: null,
    xiiStoredRelPath: null,
  });

  const { data, error } = await supabase
    .from("edudeca_college_applications")
    .insert(insertPayload)
    .select("*")
    .single();
  if (error || !data) {
    console.error("[college] upsert insert", error);
    throw error ?? new Error("Could not create college application");
  }
  return rowToApplication(data as ApplicationRow);
}

export async function listPendingCollegeApplications(): Promise<CollegeApplication[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("edudeca_college_applications")
    .select("*")
    .eq("status", "pending")
    .order("submitted_at", { ascending: false });
  if (error) {
    console.error("[college] list pending", error);
    return [];
  }
  return (data as ApplicationRow[] | null)?.map(rowToApplication) ?? [];
}

export async function listAllCollegeApplicationsForAdmin(): Promise<
  CollegeApplicationAdminView[]
> {
  const supabase = await createSupabaseServer();
  const [{ data: apps, error: appsError }, { data: roster, error: rosterError }] =
    await Promise.all([
      supabase
        .from("edudeca_college_applications")
        .select("*")
        .order("submitted_at", { ascending: false }),
      supabase.from("edudeca_college_roster").select("*"),
    ]);

  if (appsError) {
    console.error("[college] list admin apps", appsError);
    return [];
  }
  if (rosterError) {
    console.error("[college] list admin roster", rosterError);
  }

  const byKey = new Map<string, CollegeRosterStudent[]>();
  for (const row of (roster as RosterRow[] | null) ?? []) {
    const list = byKey.get(row.institution_key) ?? [];
    list.push(rowToRoster(row));
    byKey.set(row.institution_key, list);
  }

  return ((apps as ApplicationRow[] | null) ?? []).map((app) => {
    const mapped = rowToApplication(app);
    const students = [...(byKey.get(app.institution_key) ?? [])].sort((a, b) =>
      a.displayName.localeCompare(b.displayName),
    );
    return { ...mapped, roster: students };
  });
}

export async function verifyCollegeApplication(
  applicationId: string,
  comment?: string | null,
): Promise<CollegeApplication | null> {
  return decideCollegeApplication(applicationId, "approve", comment);
}

export async function decideCollegeApplication(
  applicationId: string,
  action: VerificationAction,
  comment?: string | null,
): Promise<CollegeApplication | null> {
  let decision;
  try {
    decision = buildVerificationDecision({ action, comment });
  } catch (e) {
    console.error("[college] invalid verification decision", e);
    return null;
  }

  const patch: Record<string, unknown> = {};
  if (decision.status !== undefined) patch.status = decision.status;
  if (decision.verifiedAt !== undefined) patch.verified_at = decision.verifiedAt;
  if (decision.rejectedAt !== undefined) patch.rejected_at = decision.rejectedAt;
  if (decision.adminFeedback !== undefined) {
    patch.admin_feedback = decision.adminFeedback;
  }
  if (decision.adminFeedbackAt !== undefined) {
    patch.admin_feedback_at = decision.adminFeedbackAt;
  }

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("edudeca_college_applications")
    .update(patch)
    .eq("id", applicationId)
    .select("*")
    .maybeSingle();
  if (error) {
    console.error("[college] decide", action, error);
    return null;
  }
  return data ? rowToApplication(data as ApplicationRow) : null;
}

export async function getCollegeApplicationById(
  applicationId: string,
): Promise<CollegeApplication | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("edudeca_college_applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();
  if (error) {
    console.error("[college] get by id", error);
    return null;
  }
  return data ? rowToApplication(data as ApplicationRow) : null;
}

export async function attachCollegeUploadPaths(input: {
  applicationId: string;
  xi?: { fileName: string; storedRelPath: string } | null;
  xii?: { fileName: string; storedRelPath: string } | null;
}): Promise<CollegeApplication | null> {
  const supabase = await createSupabaseServer();
  const patch: Record<string, string> = {};
  if (input.xi) {
    patch.xi_file_name = input.xi.fileName;
    patch.xi_stored_rel_path = input.xi.storedRelPath;
  }
  if (input.xii) {
    patch.xii_file_name = input.xii.fileName;
    patch.xii_stored_rel_path = input.xii.storedRelPath;
  }
  if (Object.keys(patch).length === 0) {
    return getCollegeApplicationById(input.applicationId);
  }

  const { data, error } = await supabase
    .from("edudeca_college_applications")
    .update(patch)
    .eq("id", input.applicationId)
    .select("*")
    .maybeSingle();
  if (error) {
    console.error("[college] attach uploads", error);
    return null;
  }
  return data ? rowToApplication(data as ApplicationRow) : null;
}

export async function getCollegeApplicationForUser(
  userId: string,
  client?: SupabaseClient,
): Promise<CollegeApplication | null> {
  const supabase = client ?? (await createSupabaseServer());
  const { data, error } = await supabase
    .from("edudeca_college_applications")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("[college] get for user", error);
    return null;
  }
  return data ? rowToApplication(data as ApplicationRow) : null;
}

export async function getApprovedCollegeForUser(
  userId: string,
): Promise<CollegeApplication | null> {
  const app = await getCollegeApplicationForUser(userId);
  if (!app || app.status !== "approved") return null;
  return app;
}

export async function syncStudentOntoMatchingCollegeRoster(input: {
  userId: string;
  displayName: string;
  studentCode: string | null;
  institutionName: string | null | undefined;
  state: string | null | undefined;
  city: string | null | undefined;
  classLevel: number | null | undefined;
  campaignLevel: number;
  isProctoredPaid: boolean;
  lastChallengeDate: string | null;
}): Promise<{ matched: boolean; institutionKey: string | null }> {
  const key = normalizeInstitutionName(input.institutionName);
  const state = (input.state ?? "").trim();
  const city = (input.city ?? "").trim();
  if (!key || !state || !city) return { matched: false, institutionKey: null };

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("edudeca_sync_student_college_roster", {
    p_institution_key: key,
    p_display_name: input.displayName,
    p_student_code: input.studentCode,
    p_class_level: input.classLevel ?? null,
    p_campaign_level: input.campaignLevel,
    p_is_proctored_paid: input.isProctoredPaid,
    p_last_challenge_date: input.lastChallengeDate,
    p_state: state,
    p_city: city,
  });

  if (error) {
    console.error("[college] roster sync rpc", error);
    return { matched: false, institutionKey: null };
  }

  const json = data as { matched?: boolean; institution_key?: string | null } | null;
  return {
    matched: !!json?.matched,
    institutionKey: json?.institution_key ?? null,
  };
}

export async function getRosterForInstitution(
  institutionName: string,
): Promise<CollegeRosterStudent[]> {
  const key = normalizeInstitutionName(institutionName);
  if (!key) return [];
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("edudeca_college_roster")
    .select("*")
    .eq("institution_key", key)
    .order("display_name", { ascending: true });
  if (error) {
    console.error("[college] get roster", error);
    return [];
  }
  return ((data as RosterRow[] | null) ?? []).map(rowToRoster);
}
