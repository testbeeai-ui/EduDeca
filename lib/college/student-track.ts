/**
 * Map a student's Decathlon disciplines to the college-dashboard track label.
 * Mathematics track (mat/amat) → PCM; Biology track (bio/biotech) → PCB.
 */
export function studentTrackFromDisciplines(
  disciplines: string[] | null | undefined,
): string {
  if (!Array.isArray(disciplines) || disciplines.length === 0) return "—";

  const ids = new Set(disciplines.map((id) => String(id).toLowerCase()));
  const isPcm = ids.has("mat") || ids.has("amat");
  const isPcb = ids.has("bio") || ids.has("biotech");

  if (isPcm && !isPcb) return "PCM";
  if (isPcb && !isPcm) return "PCB";
  // Mixed / incomplete lineups should not show a fake combined stream.
  return "—";
}

/** College registration "subjects taught" — what streams the institution offers. */
export function collegeStreamsOfferedLabel(math: boolean, bio: boolean): string {
  if (math && bio) return "PCM + PCB";
  if (math) return "PCM";
  if (bio) return "PCB";
  return "—";
}
