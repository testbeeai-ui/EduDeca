/**
 * Whether an EduDeca student has completed onboarding enough to skip the
 * walkthrough (returning Google login).
 */

export type EduDecaEstablishedSnapshot = {
  classLevel: number | null | undefined;
  institutionName: string | null | undefined;
  disciplines: string[] | null | undefined;
  xp?: number | null | undefined;
  campaignLevel?: number | null | undefined;
};

export function isEduDecaStudentEstablished(
  snap: EduDecaEstablishedSnapshot,
): boolean {
  // Class is required for challenge banks (XI/XII). Without it, never skip sign-in.
  const classOk = snap.classLevel === 11 || snap.classLevel === 12;
  if (!classOk) return false;

  const institutionOk = (snap.institutionName ?? "").trim().length >= 2;
  if (institutionOk) return true;

  const disciplines = snap.disciplines;
  if (Array.isArray(disciplines) && disciplines.filter(Boolean).length >= 10) {
    return true;
  }

  const xp = typeof snap.xp === "number" ? snap.xp : 0;
  const level = typeof snap.campaignLevel === "number" ? snap.campaignLevel : 1;
  if (xp > 0 || level > 1) return true;

  return false;
}

export const AUTH_NEXT_COOKIE = "edudeca_auth_next";
export const LOGIN_MODE_COOKIE = "edudeca_login_mode";
export const LOGIN_MODE_RETURNING = "returning";
