export type SignupClassLevel = 11 | 12;

export type SignupProfileLocal = {
  classLevel: SignupClassLevel;
  college: string;
  state: string;
  city: string;
};

export type SignupFormInput = {
  classLevel: SignupClassLevel | null | undefined;
  college: string | null | undefined;
  institutionAck: boolean;
  state: string | null | undefined;
  city: string | null | undefined;
};

export type EduDecaProfileRow = {
  class_level: number | null;
  institution_name: string | null;
  state: string | null;
  city: string | null;
  email?: string | null;
};

export function shouldWriteEduDecaEmail(
  existingEmail: string | null | undefined,
): boolean {
  return !(existingEmail ?? "").trim();
}

export function isSignupClassCollegeReady(
  classLevel: SignupClassLevel | null | undefined,
  college: string | null | undefined,
): boolean {
  if (classLevel !== 11 && classLevel !== 12) return false;
  return (college ?? "").trim().length >= 2;
}

export function isSignupLocationReady(
  state: string | null | undefined,
  city: string | null | undefined,
): boolean {
  return (state ?? "").trim().length > 0 && (city ?? "").trim().length > 0;
}

export function isSignupProfileReady(input: SignupFormInput): boolean {
  return (
    isSignupClassCollegeReady(input.classLevel, input.college) &&
    input.institutionAck === true &&
    isSignupLocationReady(input.state, input.city)
  );
}

/**
 * Build an EduDeca profile patch that only fills null/blank columns.
 * Returns null when nothing should be written (never overwrites set values).
 */
export function buildFillIfEmptyEduDecaProfilePatch(
  local: SignupProfileLocal,
  existing: EduDecaProfileRow,
): Partial<EduDecaProfileRow> | null {
  const patch: Partial<EduDecaProfileRow> = {};

  if (existing.class_level == null) {
    patch.class_level = local.classLevel;
  }

  const existingInstitution = (existing.institution_name ?? "").trim();
  if (!existingInstitution) {
    patch.institution_name = local.college.trim();
  }

  const existingState = (existing.state ?? "").trim();
  if (!existingState && local.state.trim()) {
    patch.state = local.state.trim();
  }

  const existingCity = (existing.city ?? "").trim();
  if (!existingCity && local.city.trim()) {
    patch.city = local.city.trim();
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

export function formatSignupClassLabel(
  classLevel: SignupClassLevel | null | undefined,
): string | null {
  if (classLevel === 11) return "Class 11";
  if (classLevel === 12) return "Class 12";
  return null;
}
