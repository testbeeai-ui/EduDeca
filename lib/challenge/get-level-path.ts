import { levelPath as baseLevelPath } from "@/data/levels";
import type { LevelNode } from "@/lib/types";

export function getLevelPath(
  campaignLevel: number,
  isProctoredPaid: boolean,
  freeZoneComplete = false
): LevelNode[] {
  return baseLevelPath.map((node) => {
    if (freeZoneComplete && !isProctoredPaid) {
      if (node.number <= 3) {
        return { ...node, status: "completed" };
      }
      if (node.number === 4) {
        return { ...node, status: "current", subtitle: "Pay ₹999 to unlock proctored round" };
      }
      return { ...node, status: "locked" };
    }

    if (node.number < campaignLevel) {
      return { ...node, status: "completed" };
    }
    if (node.number === campaignLevel) {
      return { ...node, status: "current" };
    }
    if (node.number >= 4 && !isProctoredPaid) {
      return { ...node, status: "locked" };
    }
    return { ...node, status: "locked" };
  });
}

export function zoneForLevel(level: number): string {
  if (level <= 3) return "Free Zone";
  if (level <= 6) return "Proctored Zone";
  return "Finals Zone";
}
