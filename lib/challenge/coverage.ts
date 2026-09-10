import { DISCIPLINE_IDS } from "@/data/disciplines";
import { challengeGroupsPerDiscipline } from "@/lib/challenge/spec";

export const MAX_CAMPAIGN_LEVEL = 10;

export type LevelReadyMap = Record<number, boolean>;

export type CoverageRow = {
  level: number;
  subject_id: string;
  type?: string | null;
  chapter?: string | null;
  class_level?: "XI" | "XII" | null;
};

export function emptyLevelReadyMap(): LevelReadyMap {
  const ready: LevelReadyMap = {};
  for (let level = 1; level <= MAX_CAMPAIGN_LEVEL; level += 1) {
    ready[level] = false;
  }
  return ready;
}

function coverageGroupKey(row: CoverageRow): string | null {
  const type = typeof row.type === "string" ? row.type.trim() : "";
  if (type) return type;
  const chapter = typeof row.chapter === "string" ? row.chapter.trim() : "";
  return chapter || null;
}

export function readyLevelsFromRows(
  rows: CoverageRow[],
  studentClass: "XI" | "XII",
): LevelReadyMap {
  const groupsByLevel = new Map<number, Map<string, Set<string>>>();
  for (const row of rows) {
    const level = Math.floor(Number(row.level));
    if (!Number.isInteger(level) || level < 1 || level > MAX_CAMPAIGN_LEVEL) continue;
    if (row.class_level != null && row.class_level !== studentClass) continue;

    const groupKey = coverageGroupKey(row);
    if (groupKey == null) continue;

    const groupsBySubject = groupsByLevel.get(level) ?? new Map<string, Set<string>>();
    const groups = groupsBySubject.get(row.subject_id) ?? new Set<string>();
    groups.add(groupKey);
    groupsBySubject.set(row.subject_id, groups);
    groupsByLevel.set(level, groupsBySubject);
  }

  const ready = emptyLevelReadyMap();
  for (const [level, groupsBySubject] of groupsByLevel) {
    const minimumGroups = challengeGroupsPerDiscipline(level);
    ready[level] = DISCIPLINE_IDS.every(
      (disciplineId) => (groupsBySubject.get(disciplineId)?.size ?? 0) >= minimumGroups,
    );
  }
  return ready;
}

export function comingSoonBody(level: number) {
  return {
    comingSoon: true as const,
    level,
    error: `Level ${level} questions are coming soon`,
  };
}
