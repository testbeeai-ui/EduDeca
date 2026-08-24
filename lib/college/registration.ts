/** Client-only college registration draft (no DB in Phase 1). */

export const COLLEGE_REGISTRATION_STORAGE_KEY = "edudeca_college_registration_draft";
export const AUTH_NEXT_COOKIE = "edudeca_auth_next";

export type CollegeRegistrationDraft = {
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
};

export const emptyCollegeRegistrationDraft = (): CollegeRegistrationDraft => ({
  institutionName: "",
  state: "",
  city: "",
  xiCount: "",
  xiiCount: "",
  math: true,
  bio: false,
  principalName: "",
  principalMobile: "",
  principalEmail: "",
  contactName: "",
  contactMobile: "",
  contactEmail: "",
  pledge: false,
  xiFileName: null,
  xiiFileName: null,
});

export function isCollegeRegistrationReady(draft: CollegeRegistrationDraft): boolean {
  const required = [
    draft.institutionName.trim(),
    draft.state,
    draft.city,
    draft.xiCount,
    draft.xiiCount,
    draft.principalName.trim(),
    draft.principalMobile.trim(),
    draft.principalEmail.trim(),
    draft.contactName.trim(),
    draft.contactMobile.trim(),
    draft.contactEmail.trim(),
  ];
  return required.every((v) => v !== "" && v !== null) && draft.pledge === true;
}

export function readCollegeRegistrationDraft(): CollegeRegistrationDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(COLLEGE_REGISTRATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CollegeRegistrationDraft>;
    return { ...emptyCollegeRegistrationDraft(), ...parsed };
  } catch {
    return null;
  }
}

/** True when sessionStorage still holds a college registration draft (any parseable payload). */
export function hasCollegeRegistrationDraft(): boolean {
  return readCollegeRegistrationDraft() !== null;
}

export function writeCollegeRegistrationDraft(draft: CollegeRegistrationDraft): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(COLLEGE_REGISTRATION_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* ignore quota */
  }
}

export function clearCollegeRegistrationDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(COLLEGE_REGISTRATION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
