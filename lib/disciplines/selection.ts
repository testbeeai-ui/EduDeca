import {
  DISCIPLINES,
  DISCIPLINE_SLOTS,
  FIXED_DISCIPLINE_IDS,
  LINEUP_SIZE,
  type DisciplineFamily,
  type DisciplineId,
} from "@/data/disciplines";

/** Slot index 1–10 → selected discipline id (null = empty track slot). */
export type DisciplineLineup = Record<number, DisciplineId | null>;

/** Track C slot — still stored as slot 5; v3 UI locks Entrepreneurship here. */
export const TRACK_A_SLOT = 3;
export const TRACK_B_SLOT = 4;
export const ENTREPRENEURSHIP_SLOT = 5;
export const LOCKED_ENTREPRENEURSHIP_ID: DisciplineId = "ent";

export function emptyLineup(): DisciplineLineup {
  const lineup: DisciplineLineup = {};
  for (const slot of DISCIPLINE_SLOTS) {
    if (slot.kind === "fixed" && slot.fixedId) {
      lineup[slot.slot] = slot.fixedId;
    } else if (slot.slot === ENTREPRENEURSHIP_SLOT) {
      lineup[slot.slot] = LOCKED_ENTREPRENEURSHIP_ID;
    } else {
      lineup[slot.slot] = null;
    }
  }
  return lineup;
}

/** Keep slot 5 as Entrepreneurship without touching family tracks. */
export function lockEntrepreneurshipSlot(lineup: DisciplineLineup): DisciplineLineup {
  if (lineup[ENTREPRENEURSHIP_SLOT] === LOCKED_ENTREPRENEURSHIP_ID) return lineup;
  return { ...lineup, [ENTREPRENEURSHIP_SLOT]: LOCKED_ENTREPRENEURSHIP_ID };
}

export function filledCount(lineup: DisciplineLineup): number {
  return Object.values(lineup).filter(Boolean).length;
}

export function isLineupComplete(lineup: DisciplineLineup): boolean {
  return filledCount(lineup) >= LINEUP_SIZE;
}

export function lineupIds(lineup: DisciplineLineup): DisciplineId[] {
  return DISCIPLINE_SLOTS.map((s) => lineup[s.slot]).filter(
    (id): id is DisciplineId => Boolean(id),
  );
}

/**
 * Track A + B are linked by family (math ↔ bio).
 * Track C is stored in slot 5 as locked Entrepreneurship — the picker never offers it.
 * Clicking the already-selected Track A or B option unchecks both linked slots.
 */
export function selectTrackOption(
  lineup: DisciplineLineup,
  track: "A" | "B" | "C",
  disciplineId: DisciplineId,
): DisciplineLineup {
  switch (track) {
    case "C":
      return lockEntrepreneurshipSlot(lineup);
    case "A":
    case "B": {
      const next = lockEntrepreneurshipSlot({ ...lineup });
      const family: DisciplineFamily = DISCIPLINES[disciplineId].family;
      if (family !== "math" && family !== "bio") {
        return next;
      }

      const clickedSlot = track === "A" ? TRACK_A_SLOT : TRACK_B_SLOT;
      if (lineup[clickedSlot] === disciplineId) {
        next[TRACK_A_SLOT] = null;
        next[TRACK_B_SLOT] = null;
        return next;
      }

      const slotA = DISCIPLINE_SLOTS.find((s) => s.track === "A");
      const slotB = DISCIPLINE_SLOTS.find((s) => s.track === "B");
      const pickA = slotA?.options?.find((id) => DISCIPLINES[id].family === family);
      const pickB = slotB?.options?.find((id) => DISCIPLINES[id].family === family);
      if (pickA) next[TRACK_A_SLOT] = pickA;
      if (pickB) next[TRACK_B_SLOT] = pickB;
      return next;
    }
    default: {
      const _never: never = track;
      return _never;
    }
  }
}

export function validateLineup(ids: unknown): DisciplineLineup | null {
  if (!Array.isArray(ids) || ids.length !== LINEUP_SIZE) return null;
  const allowed = new Set(Object.keys(DISCIPLINES));
  const lineup = emptyLineup();
  for (let i = 0; i < LINEUP_SIZE; i += 1) {
    const id = ids[i];
    if (typeof id !== "string" || !allowed.has(id)) return null;
    lineup[i + 1] = id as DisciplineId;
  }
  // Fixed slots must match mandatory set
  for (const fixedId of FIXED_DISCIPLINE_IDS) {
    const slot = DISCIPLINE_SLOTS.find((s) => s.fixedId === fixedId);
    if (!slot || lineup[slot.slot] !== fixedId) return null;
  }

  const locked = lockEntrepreneurshipSlot(lineup);
  const trackA = locked[TRACK_A_SLOT];
  const trackB = locked[TRACK_B_SLOT];
  const slotA = DISCIPLINE_SLOTS.find((s) => s.track === "A");
  const slotB = DISCIPLINE_SLOTS.find((s) => s.track === "B");
  if (!trackA || !trackB || !slotA?.options?.includes(trackA) || !slotB?.options?.includes(trackB)) {
    return null;
  }
  if (DISCIPLINES[trackA].family !== DISCIPLINES[trackB].family) return null;

  const lockedIds = lineupIds(locked);
  if (new Set(lockedIds).size !== lockedIds.length) return null;

  return locked;
}

/** True when two 10-id arrays match slot-for-slot. */
export function lineupIdsMatch(stored: unknown, expected: DisciplineId[]): boolean {
  if (!Array.isArray(stored) || stored.length !== expected.length) return false;
  return stored.every((id, index) => id === expected[index]);
}
