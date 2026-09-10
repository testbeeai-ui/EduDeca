import type { LevelAccent } from "@/lib/types";

export type DisciplineFamily = "math" | "bio" | null;

export type DisciplineId =
  | "phy"
  | "che"
  | "mat"
  | "bio"
  | "amat"
  | "biotech"
  | "ent"
  | "eng"
  | "eco"
  | "log"
  | "gk"
  | "fin";

export interface DisciplineDef {
  id: DisciplineId;
  name: string;
  shortName: string;
  accent: LevelAccent;
  family: DisciplineFamily;
  icon: "atom" | "flask" | "sigma" | "dna" | "ruler" | "microscope" | "lightbulb" | "message" | "hash" | "puzzle" | "globe" | "wallet";
}

export interface DisciplineSlotDef {
  slot: number;
  kind: "fixed" | "track";
  track?: "A" | "B" | "C";
  fixedId?: DisciplineId;
  options?: DisciplineId[];
}

/** Full catalog for Decathlon lineup. */
export const DISCIPLINES: Record<DisciplineId, DisciplineDef> = {
  phy: {
    id: "phy",
    name: "Physics",
    shortName: "Physics",
    accent: "teal",
    family: null,
    icon: "atom",
  },
  che: {
    id: "che",
    name: "Chemistry",
    shortName: "Chemistry",
    accent: "amber",
    family: null,
    icon: "flask",
  },
  mat: {
    id: "mat",
    name: "Mathematics",
    shortName: "Maths",
    accent: "teal",
    family: "math",
    icon: "sigma",
  },
  bio: {
    id: "bio",
    name: "Biology",
    shortName: "Biology",
    accent: "pink",
    family: "bio",
    icon: "dna",
  },
  amat: {
    id: "amat",
    name: "Applied Mathematics",
    shortName: "Applied Maths",
    accent: "violet",
    family: "math",
    icon: "ruler",
  },
  biotech: {
    id: "biotech",
    name: "Biotechnology",
    shortName: "Biotech",
    accent: "teal",
    family: "bio",
    icon: "microscope",
  },
  ent: {
    id: "ent",
    name: "Entrepreneurship",
    shortName: "Entrep",
    accent: "amber",
    family: null,
    icon: "lightbulb",
  },
  eng: {
    id: "eng",
    name: "Verbal Ability",
    shortName: "Verbal",
    accent: "teal",
    family: null,
    icon: "message",
  },
  eco: {
    id: "eco",
    name: "Quantitative Ability",
    shortName: "Quant",
    accent: "blue",
    family: null,
    icon: "hash",
  },
  log: {
    id: "log",
    name: "Analytical Ability",
    shortName: "Analytical",
    accent: "violet",
    family: null,
    icon: "puzzle",
  },
  gk: {
    id: "gk",
    name: "General Knowledge",
    shortName: "GK",
    accent: "amber",
    family: null,
    icon: "globe",
  },
  fin: {
    id: "fin",
    name: "Fin Literacy",
    shortName: "FinLit",
    accent: "pink",
    family: null,
    icon: "wallet",
  },
};

export const DISCIPLINE_SLOTS: DisciplineSlotDef[] = [
  { slot: 1, kind: "fixed", fixedId: "phy" },
  { slot: 2, kind: "fixed", fixedId: "che" },
  { slot: 3, kind: "track", track: "A", options: ["mat", "bio"] },
  { slot: 4, kind: "track", track: "B", options: ["amat", "biotech"] },
  { slot: 5, kind: "track", track: "C", options: ["ent"] },
  { slot: 6, kind: "fixed", fixedId: "eng" },
  { slot: 7, kind: "fixed", fixedId: "eco" },
  { slot: 8, kind: "fixed", fixedId: "log" },
  { slot: 9, kind: "fixed", fixedId: "gk" },
  { slot: 10, kind: "fixed", fixedId: "fin" },
];

export const FIXED_DISCIPLINE_IDS: DisciplineId[] = DISCIPLINE_SLOTS.filter(
  (s) => s.kind === "fixed" && s.fixedId,
).map((s) => s.fixedId!);

export const LINEUP_SIZE = 10;

export const DISCIPLINE_IDS = Object.keys(DISCIPLINES) as DisciplineId[];

/** Every published pool a student might pick from. Lineup is 10 of these 12. */
export const CATALOG_SIZE = DISCIPLINE_IDS.length;
