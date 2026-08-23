/**
 * Pure helpers for college student-list uploads (.csv / .xlsx).
 */

export const COLLEGE_UPLOAD_MAX_BYTES = 8 * 1024 * 1024; // 8 MB
export const COLLEGE_UPLOAD_KINDS = ["xi", "xii"] as const;
export type CollegeUploadKind = (typeof COLLEGE_UPLOAD_KINDS)[number];

const ALLOWED_EXT = new Set(["csv", "xlsx"]);

export function collegeUploadExtension(fileName: string): string | null {
  const base = fileName.trim().split(/[/\\]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  if (dot < 0 || dot === base.length - 1) return null;
  return base.slice(dot + 1).toLowerCase();
}

export function isAllowedCollegeUploadName(fileName: string): boolean {
  const ext = collegeUploadExtension(fileName);
  return ext !== null && ALLOWED_EXT.has(ext);
}

export function isAllowedCollegeUploadSize(byteLength: number): boolean {
  return byteLength > 0 && byteLength <= COLLEGE_UPLOAD_MAX_BYTES;
}

/** Safe single path segment for storage (no traversal). */
export function sanitizeCollegeUploadBaseName(fileName: string): string {
  const base = (fileName.trim().split(/[/\\]/).pop() ?? "upload").slice(0, 120);
  const cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^\.+/, "");
  return cleaned || "upload";
}

export function isCollegeUploadKind(value: string): value is CollegeUploadKind {
  return (COLLEGE_UPLOAD_KINDS as readonly string[]).includes(value);
}
