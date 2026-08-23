import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

import {
  collegeUploadExtension,
  isAllowedCollegeUploadName,
  isAllowedCollegeUploadSize,
  sanitizeCollegeUploadBaseName,
  type CollegeUploadKind,
} from "@/lib/college/upload-meta";

function uploadsRoot(): string {
  return path.join(process.cwd(), "data", "college-uploads");
}

export type SavedCollegeUpload = {
  /** Relative to data/college-uploads, e.g. userId/xi-uuid.xlsx */
  storedRelPath: string;
  originalFileName: string;
  byteLength: number;
};

export async function saveCollegeUploadFile(input: {
  userId: string;
  kind: CollegeUploadKind;
  originalFileName: string;
  bytes: Buffer;
}): Promise<SavedCollegeUpload> {
  if (!isAllowedCollegeUploadName(input.originalFileName)) {
    throw Object.assign(new Error("Only .csv or .xlsx files are allowed"), { status: 400 });
  }
  if (!isAllowedCollegeUploadSize(input.bytes.byteLength)) {
    throw Object.assign(new Error("File must be between 1 byte and 8 MB"), { status: 400 });
  }

  const ext = collegeUploadExtension(input.originalFileName) ?? "bin";
  const safeUser = sanitizeCollegeUploadBaseName(input.userId).replace(/\./g, "_") || "user";
  const fileName = `${input.kind}-${randomUUID()}.${ext}`;
  const rel = path.posix.join(safeUser, fileName);
  const absDir = path.join(uploadsRoot(), safeUser);
  const absFile = path.join(absDir, fileName);

  await fs.mkdir(absDir, { recursive: true });
  await fs.writeFile(absFile, input.bytes);

  return {
    storedRelPath: rel,
    originalFileName: input.originalFileName.trim().slice(0, 180),
    byteLength: input.bytes.byteLength,
  };
}

export async function readCollegeUploadFile(
  storedRelPath: string,
): Promise<{ absPath: string; bytes: Buffer } | null> {
  const normalized = storedRelPath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (
    !normalized ||
    normalized.includes("..") ||
    path.isAbsolute(normalized) ||
    normalized.includes("\0")
  ) {
    return null;
  }

  const absPath = path.join(uploadsRoot(), ...normalized.split("/"));
  const root = uploadsRoot();
  if (!absPath.startsWith(root + path.sep) && absPath !== root) {
    return null;
  }

  try {
    const bytes = await fs.readFile(absPath);
    return { absPath, bytes };
  } catch {
    return null;
  }
}

export function contentTypeForCollegeUpload(fileName: string): string {
  const ext = collegeUploadExtension(fileName);
  if (ext === "csv") return "text/csv; charset=utf-8";
  if (ext === "xlsx") {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  return "application/octet-stream";
}
