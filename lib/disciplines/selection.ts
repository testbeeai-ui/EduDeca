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

export function emptyLineup(): DisciplineLineup {
  const lineup: DisciplineLineup = {};
  for (const slot of DISCIPLINE_SLOTS) {
    lineup[slot.slot] = slot.kind === "fixed" && slot.fixedId ? slot.fixedId : null;
  }
  return lineup;
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
 * Track C is independent pick-1-of-2.
 * Clicking the already-selected option unchecks it (and clears the linked A/B pair).
 */
export function selectTrackOption(
  lineup: DisciplineLineup,
  track: "A" | "B" | "C",
  disciplineId: DisciplineId,
): DisciplineLineup {
  const next = { ...lineup };
  const def = DISCIPLINES[disciplineId];

  if (track === "C") {
    next[5] = lineup[5] === disciplineId ? null : disciplineId;
    return next;
  }

  const family: DisciplineFamily = def.family;
  if (family !== "math" && family !== "bio") {
    return next;
  }

  const slot = track === "A" ? 3 : 4;
  // Unclick: same card again clears both linked track slots.
  if (lineup[slot] === disciplineId) {
    next[3] = null;
    next[4] = null;
    return next;
  }

  const slotA = DISCIPLINE_SLOTS.find((s) => s.track === "A");
  const slotB = DISCIPLINE_SLOTS.find((s) => s.track === "B");
  const pickA = slotA?.options?.find((id) => DISCIPLINES[id].family === family);
  const pickB = slotB?.options?.find((id) => DISCIPLINES[id].family === family);
  if (pickA) next[3] = pickA;
  if (pickB) next[4] = pickB;
  return next;
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
  return lineup;
}
