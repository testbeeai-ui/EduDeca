import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { readyLevelsFromRows } from "./coverage";

describe("question bank coverage", () => {
  const disciplineIds = [
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

  it("marks only levels that have a full catalog set", () => {
    const ready = readyLevelsFromRows(
      [
        ...disciplineIds.map((subject_id) => ({
          level: 1,
          subject_id,
          type: "TYPE 1 — A",
          class_level: null,
        })),
        {
          level: 2,
          subject_id: "phy",
          type: "TYPE 1 — A",
          class_level: null,
        },
      ],
      "XI",
    );
    assert.equal(ready[1], true);
    assert.equal(ready[2], false);
    assert.equal(ready[3], false);
  });

  it("does not mark a level ready when a track discipline is still empty", () => {
    const withoutBio = readyLevelsFromRows(
      disciplineIds
        .filter((subject_id) => subject_id !== "bio")
        .map((subject_id) => ({
          level: 1,
          subject_id,
          chapter: "CHAPTER 1",
          class_level: null,
        })),
      "XI",
    );
    assert.equal(withoutBio[1], false);
  });

  it("marks Level 2 ready only when each discipline has 2 groups for this class", () => {
    const rows = disciplineIds.flatMap((subject_id) => [
      { level: 2, subject_id, type: "TYPE 1 — A", class_level: null },
      { level: 2, subject_id, type: "TYPE 2 — B", class_level: null },
    ]);
    const ready = readyLevelsFromRows(
      [
        ...rows.filter(
          (row) => !(row.subject_id === "phy" && row.type === "TYPE 2 — B"),
        ),
        {
          level: 2,
          subject_id: "phy",
          chapter: "CH 2",
          class_level: "XII",
        },
      ],
      "XI",
    );
    assert.equal(ready[2], false);
  });

  it("counts null class_level toward both classes", () => {
    const rows = disciplineIds.map((subject_id) => ({
      level: 1,
      subject_id,
      type: "TYPE 1 — A",
      class_level: null,
    }));
    assert.equal(readyLevelsFromRows(rows, "XI")[1], true);
    assert.equal(readyLevelsFromRows(rows, "XII")[1], true);
  });
});
