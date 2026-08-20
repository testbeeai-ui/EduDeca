/** Normalize institution names for student ↔ college matching (no DB schema). */

export function normalizeInstitutionName(name: string | null | undefined): string {
  return (name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
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
