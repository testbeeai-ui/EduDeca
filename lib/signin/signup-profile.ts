export type SignupClassLevel = 11 | 12;

export type SignupProfileLocal = {
  classLevel: SignupClassLevel;
  college: string;
};

export type ProfileClassCollege = {
  class_level: number | null;
  institution_name: string | null;
};

export function isSignupProfileReady(
  classLevel: SignupClassLevel | null | undefined,
  college: string | null | undefined,
): boolean {
  if (classLevel !== 11 && classLevel !== 12) return false;
  return (college ?? "").trim().length >= 2;
}

/**
 * Build a profiles update that only fills null/blank columns.
 * Returns null when nothing should be written (never overwrites set values).
 */
export function buildFillIfEmptyProfilePatch(
  local: SignupProfileLocal,
  existing: ProfileClassCollege,
): Partial<ProfileClassCollege> | null {
  const patch: Partial<ProfileClassCollege> = {};

  if (existing.class_level == null) {
    patch.class_level = local.classLevel;
  }

  const existingInstitution = (existing.institution_name ?? "").trim();
  if (!existingInstitution) {
    patch.institution_name = local.college.trim();
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
