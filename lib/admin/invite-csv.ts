import { normalizeInviteEmail } from "@/lib/admin/invite-dispatch";
import type { StudentInviteRecord } from "@/lib/admin/invite-types";

/** Flexible CSV / text parser that handles real-world variations in header names. */
export function parseStudentCsv(
  csvText: string,
  defaultCollegeName = "Vishwa College",
): {
  records: Omit<StudentInviteRecord, "id" | "batchId" | "status" | "invitedAt" | "joinedAt">[];
  collegeNameDetected: string;
  xiCount: number;
  xiiCount: number;
  errors: string[];
} {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return {
      records: [],
      collegeNameDetected: defaultCollegeName,
      xiCount: 0,
      xiiCount: 0,
      errors: ["CSV file is empty"],
    };
  }

  const firstLine = lines[0];
  const delimiter = firstLine.includes("\t")
    ? "\t"
    : firstLine.includes(";")
      ? ";"
      : ",";

  const splitRow = (row: string) =>
    row.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ""));

  const headers = splitRow(lines[0]).map((h) => h.toLowerCase());

  let emailIdx = headers.findIndex((h) =>
    /email|e-mail|mail|email_address|mail_id/.test(h),
  );
  let nameIdx = headers.findIndex((h) =>
    /name|student_name|full_name|candidate_name/.test(h),
  );
  let codeIdx = headers.findIndex((h) =>
    /id|student_id|code|student_code|roll|reg|usn|admission/.test(h),
  );
  let classIdx = headers.findIndex((h) =>
    /class|grade|level|standard|std|class_level/.test(h),
  );
  const collegeIdx = headers.findIndex((h) =>
    /college|institution|school|college_name/.test(h),
  );

  const hasHeaderRow =
    emailIdx !== -1 || nameIdx !== -1 || codeIdx !== -1 || classIdx !== -1;
  const startRow = hasHeaderRow ? 1 : 0;

  if (!hasHeaderRow) {
    emailIdx = 0;
    nameIdx = 1;
    codeIdx = 2;
    classIdx = 3;
  }

  const records: Omit<
    StudentInviteRecord,
    "id" | "batchId" | "status" | "invitedAt" | "joinedAt"
  >[] = [];
  let detectedCollege = defaultCollegeName;
  let xiCount = 0;
  let xiiCount = 0;
  const errors: string[] = [];

  for (let i = startRow; i < lines.length; i++) {
    const cols = splitRow(lines[i]);
    if (cols.length === 0 || cols.every((c) => c === "")) continue;

    let email = (cols[emailIdx] || "").trim();
    if (!email.includes("@")) {
      const foundEmail = cols.find((c) => c.includes("@") && c.includes("."));
      if (foundEmail) email = foundEmail.trim();
    }

    if (!email || !email.includes("@")) {
      errors.push(`Row ${i + 1}: Skipping invalid or missing email (${cols.join(", ")})`);
      continue;
    }

    const name =
      nameIdx !== -1 && cols[nameIdx] ? cols[nameIdx].trim() : email.split("@")[0];
    const studentCode =
      codeIdx !== -1 && cols[codeIdx] ? cols[codeIdx].trim() : null;

    let classLevel: 11 | 12 | null = null;
    if (classIdx !== -1 && cols[classIdx]) {
      const rawClass = cols[classIdx].toLowerCase();
      if (rawClass.includes("11") || rawClass.includes("xi")) {
        classLevel = 11;
        xiCount++;
      } else if (rawClass.includes("12") || rawClass.includes("xii")) {
        classLevel = 12;
        xiiCount++;
      }
    }

    if (collegeIdx !== -1 && cols[collegeIdx] && cols[collegeIdx].trim()) {
      detectedCollege = cols[collegeIdx].trim();
    }

    records.push({
      collegeName: detectedCollege,
      email: normalizeInviteEmail(email),
      name,
      studentCode,
      classLevel,
    });
  }

  return {
    records,
    collegeNameDetected: detectedCollege,
    xiCount,
    xiiCount,
    errors,
  };
}
