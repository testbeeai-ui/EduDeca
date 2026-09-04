import {
  applyReturnQuery,
  createEmptyProgress,
  isMockSetNumber,
  isMockTestLevel,
  type MockProgressState,
  type ReturnQuery,
} from "./progress-store";

export type AttemptRow = {
  level: number;
  set_number: number;
  status: string;
  score_pct: number | null;
  correct: number | null;
  total: number | null;
  answers?: unknown;
  updated_at: string;
};

export type AttemptUpsert = {
  level: number;
  set_number: number;
  status: "inprogress" | "completed";
  score_pct: number | null;
  correct: number | null;
  total: number | null;
  answers?: unknown;
};

export function progressFromAttemptRows(rows: AttemptRow[]): MockProgressState {
  let state = createEmptyProgress();
  for (const row of rows) {
    if (!isMockTestLevel(row.level) || !isMockSetNumber(row.set_number)) continue;
    if (row.status !== "completed" && row.status !== "inprogress") continue;
    const query: ReturnQuery = {
      level: row.level,
      set: row.set_number,
      status: row.status,
      scorePct: row.score_pct ?? undefined,
      correct: row.correct ?? undefined,
      total: row.total ?? undefined,
    };
    state = applyReturnQuery(state, query, row.updated_at);
  }
  return state;
}

export function createRemoteRequestGate() {
  let latest = 0;
  let applied = 0;
  return {
    start() {
      latest += 1;
      return latest;
    },
    shouldApply(id: number) {
      if (id <= applied) return false;
      applied = id;
      return true;
    },
  };
}

export function mergeProgressStates(
  server: MockProgressState,
  client: MockProgressState,
): MockProgressState {
  const lastLevel = client.lastLevel;
  let next: MockProgressState = {
    lastLevel,
    sets: { ...server.sets },
  };
  for (const [key, value] of Object.entries(client.sets)) {
    if (next.sets[key]?.status === "completed") continue;
    if (value.status === "completed") continue;
    const [levelRaw, setRaw] = key.split("-");
    const level = Number(levelRaw);
    const set = Number(setRaw);
    if (!isMockTestLevel(level) || !isMockSetNumber(set)) continue;
    next = applyReturnQuery(
      next,
      {
        level,
        set,
        status: value.status,
        scorePct: value.scorePct,
        correct: value.correct,
        total: value.total,
      },
      value.updatedAt,
    );
  }
  return { ...next, lastLevel };
}

export function buildAttemptUpserts(
  existing: AttemptRow[],
  incoming: MockProgressState,
): AttemptUpsert[] {
  const prior = new Map<string, AttemptRow>(
    existing.map((row) => [`${row.level}-${row.set_number}`, row]),
  );
  const writes: AttemptUpsert[] = [];
  for (const [key, entry] of Object.entries(incoming.sets)) {
    const [levelRaw, setRaw] = key.split("-");
    const level = Number(levelRaw);
    const setNumber = Number(setRaw);
    if (!isMockTestLevel(level) || !isMockSetNumber(setNumber)) continue;
    if (entry.status !== "completed" && entry.status !== "inprogress") continue;
    const row = prior.get(key);
    if (row?.status === "completed") {
      writes.push({
        level: row.level,
        set_number: row.set_number,
        status: "completed",
        score_pct: row.score_pct,
        correct: row.correct,
        total: row.total,
        answers: row.answers,
      });
      continue;
    }
    const write: AttemptUpsert = {
      level,
      set_number: setNumber,
      status: "inprogress",
      score_pct: null,
      correct: null,
      total: null,
    };
    if (row && "answers" in row) write.answers = row.answers;
    writes.push(write);
  }
  return writes;
}
