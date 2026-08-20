import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

import { normalizeInstitutionName } from "@/lib/college/normalize-institution";
import type { CollegeRegistrationDraft } from "@/lib/college/registration";

export type CollegeApplicationStatus = "pending" | "approved" | "rejected";

export type CollegeApplication = {
  id: string;
  userId: string;
  email: string | null;
  status: CollegeApplicationStatus;
  submittedAt: string;
  verifiedAt: string | null;
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
  /** Optional Class XI student-list upload filename (file bytes not stored). */
  xiFileName: string | null;
  /** Optional Class XII student-list upload filename (file bytes not stored). */
  xiiFileName: string | null;
};

export type CollegeRosterStudent = {
  userId: string;
  displayName: string;
  studentCode: string | null;
  classLevel: 11 | 12 | null;
  campaignLevel: number;
  isProctoredPaid: boolean;
  lastChallengeDate: string | null;
  syncedAt: string;
};

export type CollegeRegistry = {
  applications: CollegeApplication[];
  rosters: Record<string, CollegeRosterStudent[]>;
};

const EMPTY: CollegeRegistry = { applications: [], rosters: {} };

/** Serialize registry writes in this process to reduce lost-update races. */
let writeChain: Promise<void> = Promise.resolve();

function withRegistryLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function registryPath(): string {
  return path.join(process.cwd(), "data", "college-registry.json");
}

async function ensureStore(): Promise<void> {
  const dir = path.dirname(registryPath());
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(registryPath());
  } catch {
    await fs.writeFile(registryPath(), JSON.stringify(EMPTY, null, 2), "utf8");
  }
}

export async function readCollegeRegistry(): Promise<CollegeRegistry> {
  await ensureStore();
  const raw = await fs.readFile(registryPath(), "utf8");
  try {
    const parsed = JSON.parse(raw) as Partial<CollegeRegistry>;
    return {
      applications: Array.isArray(parsed.applications) ? parsed.applications : [],
      rosters:
        parsed.rosters && typeof parsed.rosters === "object" ? parsed.rosters : {},
    };
  } catch {
    return { ...EMPTY, applications: [], rosters: {} };
  }
}

async function writeCollegeRegistry(registry: CollegeRegistry): Promise<void> {
  await ensureStore();
  await fs.writeFile(registryPath(), JSON.stringify(registry, null, 2), "utf8");
}

export function draftToApplicationFields(draft: CollegeRegistrationDraft) {
  return {
    institutionName: draft.institutionName.trim(),
    state: draft.state.trim(),
    city: draft.city.trim(),
    xiCount: draft.xiCount,
    xiiCount: draft.xiiCount,
    math: draft.math,
    bio: draft.bio,
    principalName: draft.principalName.trim(),
    principalMobile: draft.principalMobile.trim(),
    principalEmail: draft.principalEmail.trim(),
    contactName: draft.contactName.trim(),
    contactMobile: draft.contactMobile.trim(),
    contactEmail: draft.contactEmail.trim(),
    pledge: draft.pledge,
    xiFileName: draft.xiFileName?.trim() || null,
    xiiFileName: draft.xiiFileName?.trim() || null,
  };
}

export async function upsertCollegeApplication(input: {
  userId: string;
  email: string | null;
  draft: CollegeRegistrationDraft;
}): Promise<CollegeApplication> {
  return withRegistryLock(async () => {
    const registry = await readCollegeRegistry();
    const fields = draftToApplicationFields(input.draft);
    const existing = registry.applications.find((a) => a.userId === input.userId);

    if (existing) {
      // Never downgrade an approved college from a re-submit.
      if (existing.status === "approved") {
        const merged: CollegeApplication = {
          ...existing,
          ...fields,
          email: input.email,
          status: "approved",
          verifiedAt: existing.verifiedAt,
        };
        registry.applications = registry.applications.map((a) =>
          a.id === existing.id ? merged : a,
        );
        await writeCollegeRegistry(registry);
        return merged;
      }

      const merged: CollegeApplication = {
        ...existing,
        ...fields,
        email: input.email,
        status: "pending",
        verifiedAt: null,
        submittedAt: new Date().toISOString(),
      };
      registry.applications = registry.applications.map((a) =>
        a.id === existing.id ? merged : a,
      );
      await writeCollegeRegistry(registry);
      return merged;
    }

    const created: CollegeApplication = {
      id: randomUUID(),
      userId: input.userId,
      email: input.email,
      status: "pending",
      submittedAt: new Date().toISOString(),
      verifiedAt: null,
      ...fields,
    };
    registry.applications.push(created);
    await writeCollegeRegistry(registry);
    return created;
  });
}

export async function listPendingCollegeApplications(): Promise<CollegeApplication[]> {
  const registry = await readCollegeRegistry();
  return registry.applications
    .filter((a) => a.status === "pending")
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export type CollegeApplicationAdminView = CollegeApplication & {
  roster: CollegeRosterStudent[];
};

export async function listAllCollegeApplicationsForAdmin(): Promise<
  CollegeApplicationAdminView[]
> {
  const registry = await readCollegeRegistry();
  const apps = [...registry.applications].sort((a, b) =>
    b.submittedAt.localeCompare(a.submittedAt),
  );
  return apps.map((app) => {
    const key = normalizeInstitutionName(app.institutionName);
    const roster = key ? registry.rosters[key] ?? [] : [];
    return {
      ...app,
      xiFileName: app.xiFileName ?? null,
      xiiFileName: app.xiiFileName ?? null,
      roster: [...roster].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    };
  });
}

export async function verifyCollegeApplication(
  applicationId: string,
): Promise<CollegeApplication | null> {
  return withRegistryLock(async () => {
    const registry = await readCollegeRegistry();
    const idx = registry.applications.findIndex((a) => a.id === applicationId);
    if (idx < 0) return null;
    const current = registry.applications[idx];
    if (!current) return null;
    const next: CollegeApplication = {
      ...current,
      status: "approved",
      verifiedAt: new Date().toISOString(),
    };
    registry.applications[idx] = next;
    await writeCollegeRegistry(registry);
    return next;
  });
}

export async function getCollegeApplicationForUser(
  userId: string,
): Promise<CollegeApplication | null> {
  const registry = await readCollegeRegistry();
  return registry.applications.find((a) => a.userId === userId) ?? null;
}

export async function getApprovedCollegeForUser(
  userId: string,
): Promise<CollegeApplication | null> {
  const app = await getCollegeApplicationForUser(userId);
  if (!app || app.status !== "approved") return null;
  return app;
}

export async function syncStudentOntoMatchingCollegeRoster(input: {
  userId: string;
  displayName: string;
  studentCode: string | null;
  institutionName: string | null | undefined;
  classLevel: number | null | undefined;
  campaignLevel: number;
  isProctoredPaid: boolean;
  lastChallengeDate: string | null;
}): Promise<{ matched: boolean; institutionKey: string | null }> {
  const key = normalizeInstitutionName(input.institutionName);
  if (!key) return { matched: false, institutionKey: null };

  return withRegistryLock(async () => {
    const registry = await readCollegeRegistry();
    const approved = registry.applications.find(
      (a) =>
        a.status === "approved" &&
        normalizeInstitutionName(a.institutionName) === key,
    );
    if (!approved) return { matched: false, institutionKey: null };

    const classLevel =
      input.classLevel === 11 || input.classLevel === 12 ? input.classLevel : null;

    const entry: CollegeRosterStudent = {
      userId: input.userId,
      displayName: input.displayName.trim() || "Student",
      studentCode: input.studentCode,
      classLevel,
      campaignLevel: input.campaignLevel,
      isProctoredPaid: input.isProctoredPaid,
      lastChallengeDate: input.lastChallengeDate,
      syncedAt: new Date().toISOString(),
    };

    const list = registry.rosters[key] ?? [];
    const without = list.filter((s) => s.userId !== input.userId);
    registry.rosters[key] = [...without, entry];
    await writeCollegeRegistry(registry);
    return { matched: true, institutionKey: key };
  });
}

export async function getRosterForInstitution(
  institutionName: string,
): Promise<CollegeRosterStudent[]> {
  const key = normalizeInstitutionName(institutionName);
  if (!key) return [];
  const registry = await readCollegeRegistry();
  return registry.rosters[key] ?? [];
}
