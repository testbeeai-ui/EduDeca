/**
 * Stage optional XI/XII spreadsheets in IndexedDB so they survive Google OAuth.
 */

import type { CollegeUploadKind } from "@/lib/college/upload-meta";
import {
  isAllowedCollegeUploadName,
  isAllowedCollegeUploadSize,
} from "@/lib/college/upload-meta";

const DB_NAME = "edudeca_college_pending_uploads";
const STORE = "files";
const DB_VERSION = 1;

export type StagedCollegeUpload = {
  name: string;
  type: string;
  blob: Blob;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

export async function stageCollegeUploadFile(
  kind: CollegeUploadKind,
  file: File,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isAllowedCollegeUploadName(file.name)) {
    return { ok: false, error: "Only .csv or .xlsx files are allowed." };
  }
  if (!isAllowedCollegeUploadSize(file.size)) {
    return { ok: false, error: "Each file must be 8 MB or smaller." };
  }

  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
      tx.objectStore(STORE).put(
        { name: file.name, type: file.type || "", blob: file } satisfies StagedCollegeUpload,
        kind,
      );
    });
    return { ok: true };
  } finally {
    db.close();
  }
}

export async function readStagedCollegeUpload(
  kind: CollegeUploadKind,
): Promise<StagedCollegeUpload | null> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(kind);
      req.onsuccess = () => {
        const value = req.result as StagedCollegeUpload | undefined;
        resolve(value?.blob ? value : null);
      };
      req.onerror = () => reject(req.error ?? new Error("IndexedDB read failed"));
    });
  } finally {
    db.close();
  }
}

export async function clearStagedCollegeUploads(): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB clear failed"));
      tx.objectStore(STORE).clear();
    });
  } finally {
    db.close();
  }
}

export async function stagedUploadsToFiles(): Promise<{
  xiFile: File | null;
  xiiFile: File | null;
}> {
  const [xi, xii] = await Promise.all([
    readStagedCollegeUpload("xi"),
    readStagedCollegeUpload("xii"),
  ]);
  return {
    xiFile: xi ? new File([xi.blob], xi.name, { type: xi.type || undefined }) : null,
    xiiFile: xii ? new File([xii.blob], xii.name, { type: xii.type || undefined }) : null,
  };
}
