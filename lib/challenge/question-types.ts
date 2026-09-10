/** One source-doc TYPE heading per question. Null if the document had no TYPE. Chapters belong on `chapter`, not here. */
export function normalizeQuestionType(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const label = raw.trim();
  return label.length > 0 ? label : null;
}
