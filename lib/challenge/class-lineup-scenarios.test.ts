import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { readyLevelsFromRows, type CoverageRow } from "./coverage";
import {
  matchesStudentClass,
  pickUnseenRound,
  type PoolItem,
} from "./question-seen";
import { lineupIds, selectPathFamily, emptyLineup, isLineupComplete } from "@/lib/disciplines/selection";

const MATH_LINEUP = lineupIds(selectPathFamily(emptyLineup(), "math"));
const BIO_LINEUP = lineupIds(selectPathFamily(emptyLineup(), "bio"));

function item(
  id: string,
  disciplineId: string,
  extra?: Partial<PoolItem>,
): PoolItem {
  return {
    id,
    disciplineId,
    level: extra?.level ?? 1,
    published: extra?.published ?? true,
    type: extra && "type" in extra ? extra.type : "TYPE 1 — X",
    chapter: extra?.chapter,
    classLevel: extra?.classLevel,
  };
}

function bankForLineup(lineup: readonly string[]): PoolItem[] {
  const cbse = new Set(["phy", "che", "mat", "amat", "bio", "biotech"]);
  return lineup.flatMap((disc) => {
    if (cbse.has(disc)) {
      return [
        item(`${disc}-xi`, disc, {
          type: null,
          chapter: "CH 1",
          classLevel: "XI",
        }),
        item(`${disc}-xii`, disc, {
          type: null,
          chapter: "CH 1",
          classLevel: "XII",
        }),
      ];
    }
    return [item(`${disc}-any`, disc, { type: "TYPE 1 — X", classLevel: null })];
  });
}

describe("class 11 vs 12 discipline lineups", () => {
  it("math path fills Physics, Chemistry, Maths, Applied Maths", () => {
    assert.deepEqual(MATH_LINEUP, [
      "phy",
      "che",
      "mat",
      "amat",
      "ent",
      "eng",
      "eco",
      "log",
      "gk",
      "fin",
    ]);
    assert.equal(isLineupComplete(selectPathFamily(emptyLineup(), "math")), true);
  });

  it("bio path fills Physics, Chemistry, Biology, Biotechnology", () => {
    assert.deepEqual(BIO_LINEUP, [
      "phy",
      "che",
      "bio",
      "biotech",
      "ent",
      "eng",
      "eco",
      "log",
      "gk",
      "fin",
    ]);
    assert.equal(isLineupComplete(selectPathFamily(emptyLineup(), "bio")), true);
  });

  for (const studentClass of ["XI", "XII"] as const) {
    for (const [path, lineup] of [
      ["math", MATH_LINEUP],
      ["bio", BIO_LINEUP],
    ] as const) {
      it(`Class ${studentClass === "XI" ? "11" : "12"} + ${path} path only serves that class's CBSE cards`, () => {
        const round = pickUnseenRound({
          bank: bankForLineup(lineup),
          lineupIds: lineup,
          seenIds: new Set(),
          level: 1,
          seed: 7,
          studentClass,
          perDiscipline: 1,
        });
        assert.equal(round.ok, true);
        if (!round.ok) return;
        assert.equal(round.questions.length, 10);
        assert.deepEqual(
          [...new Set(round.questions.map((q) => q.disciplineId))].sort(),
          [...lineup].sort(),
        );
        for (const q of round.questions) {
          assert.equal(matchesStudentClass(q, studentClass), true);
          if (q.classLevel != null) {
            assert.equal(q.classLevel, studentClass);
            assert.equal(q.id.endsWith(studentClass === "XI" ? "-xi" : "-xii"), true);
          }
        }
      });
    }
  }

  it("Class 12 never receives Class 11 CBSE rows", () => {
    const round = pickUnseenRound({
      bank: bankForLineup(BIO_LINEUP),
      lineupIds: BIO_LINEUP,
      seenIds: new Set(),
      level: 1,
      seed: 4,
      studentClass: "XII",
      perDiscipline: 1,
    });
    assert.equal(round.ok, true);
    if (!round.ok) return;
    assert.equal(round.questions.some((q) => q.id.endsWith("-xi")), false);
    assert.equal(round.questions.find((q) => q.disciplineId === "bio")?.id, "bio-xii");
  });
});

describe("class coverage readiness", () => {
  const allDisc = [
    "phy",
    "che",
    "mat",
    "amat",
    "bio",
    "biotech",
    "ent",
    "eng",
    "eco",
    "log",
    "gk",
    "fin",
  ];

  it("XI-tagged CBSE rows do not make Level 1 ready for XII", () => {
    const rows: CoverageRow[] = allDisc.map((subject_id) => ({
      level: 1,
      subject_id,
      type: "TYPE 1 — A",
      class_level: ["phy", "che", "mat", "amat", "bio", "biotech"].includes(subject_id)
        ? "XI"
        : null,
    }));
    assert.equal(readyLevelsFromRows(rows, "XI")[1], true);
    assert.equal(readyLevelsFromRows(rows, "XII")[1], false);
  });
});
