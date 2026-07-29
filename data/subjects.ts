import { DISCIPLINES, type DisciplineId } from "@/data/disciplines";
import type { Subject } from "@/lib/types";

/** Catalog used for progress maps — includes all 13 Decathlon disciplines. */
export const subjects: Subject[] = (
  Object.keys(DISCIPLINES) as DisciplineId[]
).map((id) => {
  const d = DISCIPLINES[id];
  return {
    id: d.id,
    name: d.shortName,
    abbrev: d.shortName.slice(0, 3).toUpperCase(),
    level: 1,
    accent: d.accent === "blue" ? "teal" : d.accent,
  };
});
