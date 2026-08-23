/** Normalize institution names and locations for student ↔ college matching. */

export function normalizeInstitutionName(name: string | null | undefined): string {
  return (name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeLocationPart(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function institutionsMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const left = normalizeInstitutionName(a);
  const right = normalizeInstitutionName(b);
  if (!left || !right) return false;
  return left === right;
}

export function locationsMatch(
  aState: string | null | undefined,
  aCity: string | null | undefined,
  bState: string | null | undefined,
  bCity: string | null | undefined,
): boolean {
  const leftState = normalizeLocationPart(aState);
  const leftCity = normalizeLocationPart(aCity);
  const rightState = normalizeLocationPart(bState);
  const rightCity = normalizeLocationPart(bCity);
  if (!leftState || !leftCity || !rightState || !rightCity) return false;
  return leftState === rightState && leftCity === rightCity;
}

export type CollegeJoinIdentity = {
  institutionName: string | null | undefined;
  state: string | null | undefined;
  city: string | null | undefined;
};

/** Student may join a college only when institution name and location both match. */
export function collegeJoinMatch(
  student: CollegeJoinIdentity,
  college: CollegeJoinIdentity,
): boolean {
  return (
    institutionsMatch(student.institutionName, college.institutionName) &&
    locationsMatch(student.state, student.city, college.state, college.city)
  );
}
