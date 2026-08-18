export type SignupClassLevel = 11 | 12;

export type SignupProfileLocal = {
  classLevel: SignupClassLevel;
  college: string;
  stream?: string | null;
  state?: string | null;
  city?: string | null;
};

export type ProfileClassCollege = {
  class_level: number | null;
  institution_name: string | null;
  stream?: string | null;
  state?: string | null;
  city?: string | null;
};

export type SignupFormGate = {
  classLevel: SignupClassLevel | null | undefined;
  college: string | null | undefined;
  scienceStream: boolean;
  institutionAck: boolean;
  state: string | null | undefined;
  city: string | null | undefined;
};

export function isSignupProfileReady(
  classLevel: SignupClassLevel | null | undefined,
  college: string | null | undefined,
): boolean {
  if (classLevel !== 11 && classLevel !== 12) return false;
  return (college ?? "").trim().length >= 2;
}

/** Google stays disabled until the HTML Step 6 form is complete. */
export function isSignupFormReady(form: SignupFormGate): boolean {
  if (!isSignupProfileReady(form.classLevel, form.college)) return false;
  if (!form.scienceStream) return false;
  if (!form.institutionAck) return false;
  if (!(form.state ?? "").trim()) return false;
  if (!(form.city ?? "").trim()) return false;
  return true;
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

  const existingStream = (existing.stream ?? "").trim();
  const nextStream = (local.stream ?? "").trim();
  if (!existingStream && nextStream) {
    patch.stream = nextStream;
  }

  const existingState = (existing.state ?? "").trim();
  const nextState = (local.state ?? "").trim();
  if (!existingState && nextState) {
    patch.state = nextState;
  }

  const existingCity = (existing.city ?? "").trim();
  const nextCity = (local.city ?? "").trim();
  if (!existingCity && nextCity) {
    patch.city = nextCity;
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
