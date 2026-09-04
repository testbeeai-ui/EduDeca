import { MOCK_SET_COUNT, type MockSetStatus, type MockTestLevelId } from "./catalog";

export const MOCK_PROGRESS_STORAGE_KEY = "edudeca.mock-progress.v1";

export type SetProgress = {
  status: Exclude<MockSetStatus, "new">;
  scorePct?: number;
  correct?: number;
  total?: number;
  updatedAt: string;
};

export type MockProgressState = {
  lastLevel: MockTestLevelId;
  sets: Record<string, SetProgress>;
};

export type ReturnQuery = {
  level: MockTestLevelId;
  set: number;
  status: SetProgress["status"];
  scorePct?: number;
  correct?: number;
  total?: number;
};

export function setProgressKey(level: number, set: number): string {
  return `${level}-${set}`;
}

export function createEmptyProgress(): MockProgressState {
  return { lastLevel: 1, sets: {} };
}

export function isMockTestLevel(value: number): value is MockTestLevelId {
  return value === 1 || value === 2 || value === 3;
}

export function isMockSetNumber(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= MOCK_SET_COUNT;
}

function parseIntParam(raw: string | null): number | null {
  if (raw == null || raw.trim() === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function parseStatus(raw: string | null): SetProgress["status"] | null {
  if (raw === "completed" || raw === "inprogress") return raw;
  return null;
}

export function parseReturnQuery(params: URLSearchParams): ReturnQuery | null {
  const level = parseIntParam(params.get("level"));
  const set = parseIntParam(params.get("set"));
  const status = parseStatus(params.get("status"));
  if (level == null || set == null || status == null) return null;
  if (!isMockTestLevel(level) || !isMockSetNumber(set)) return null;

  const correct = parseIntParam(params.get("correct")) ?? undefined;
  const total = parseIntParam(params.get("total")) ?? undefined;
  let scorePct = parseIntParam(params.get("score")) ?? undefined;
  if (scorePct == null && correct != null && total && total > 0) {
    scorePct = Math.round((correct / total) * 100);
  }
  if (scorePct != null) {
    scorePct = Math.min(100, Math.max(0, scorePct));
  }

  return {
    level,
    set,
    status,
    scorePct,
    correct,
    total,
  };
}

function betterScore(current: number | undefined, incoming: number | undefined): number | undefined {
  if (current == null) return incoming;
  if (incoming == null) return current;
  return Math.max(current, incoming);
}

export function applyReturnQuery(
  state: MockProgressState,
  query: ReturnQuery | null,
  now = new Date().toISOString(),
): MockProgressState {
  if (!query) return state;

  const key = setProgressKey(query.level, query.set);
  const existing = state.sets[key];

  if (existing?.status === "completed" && query.status === "inprogress") {
    return { ...state, lastLevel: query.level, sets: { ...state.sets } };
  }

  const status: SetProgress["status"] =
    existing?.status === "completed" || query.status === "completed" ? "completed" : "inprogress";

  const nextEntry: SetProgress = {
    status,
    scorePct: betterScore(existing?.scorePct, query.scorePct),
    correct: query.correct ?? existing?.correct,
    total: query.total ?? existing?.total,
    updatedAt: now,
  };

  if (status === "completed" && existing?.status === "completed") {
    if ((existing.scorePct ?? -1) >= (query.scorePct ?? -1)) {
      nextEntry.correct = existing.correct;
      nextEntry.total = existing.total;
    }
  }

  return {
    lastLevel: query.level,
    sets: { ...state.sets, [key]: nextEntry },
  };
}

export function setLastLevel(state: MockProgressState, level: MockTestLevelId): MockProgressState {
  return { ...state, lastLevel: level };
}

export function getSetProgress(
  state: MockProgressState,
  level: MockTestLevelId,
  set: number,
): SetProgress | null {
  return state.sets[setProgressKey(level, set)] ?? null;
}

export function completedSetCountForLevel(state: MockProgressState, level: MockTestLevelId): number {
  const prefix = `${level}-`;
  let count = 0;
  for (const [key, value] of Object.entries(state.sets)) {
    if (key.startsWith(prefix) && value.status === "completed") count += 1;
  }
  return count;
}

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export function parseProgressRaw(raw: string | null): MockProgressState {
  if (!raw) return createEmptyProgress();
  try {
    const parsed = JSON.parse(raw) as Partial<MockProgressState>;
    const lastLevel = Number(parsed.lastLevel);
    if (!isMockTestLevel(lastLevel)) return createEmptyProgress();
    const sets =
      parsed.sets && typeof parsed.sets === "object" && !Array.isArray(parsed.sets)
        ? parsed.sets
        : {};
    return { lastLevel, sets };
  } catch {
    return createEmptyProgress();
  }
}

export function loadProgress(storage: StorageLike | null | undefined): MockProgressState {
  if (!storage) return createEmptyProgress();
  try {
    return parseProgressRaw(storage.getItem(MOCK_PROGRESS_STORAGE_KEY));
  } catch {
    return createEmptyProgress();
  }
}

export const MOCK_PROGRESS_EVENT = "edudeca-mock-progress";

export function subscribeMockProgress(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === MOCK_PROGRESS_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(MOCK_PROGRESS_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(MOCK_PROGRESS_EVENT, onStoreChange);
  };
}

export function getMockProgressSnapshot(): string {
  try {
    return window.localStorage.getItem(MOCK_PROGRESS_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function getMockProgressServerSnapshot(): string {
  return "";
}

export function saveProgress(storage: StorageLike | null | undefined, state: MockProgressState): void {
  if (!storage) return;
  storage.setItem(MOCK_PROGRESS_STORAGE_KEY, JSON.stringify(state));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(MOCK_PROGRESS_EVENT));
  }
}
