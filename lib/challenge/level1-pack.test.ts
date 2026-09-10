import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  LEVEL1_SET_COUNT,
  buildLevel1Attempt,
  hashSeed,
  level1SetNumber,
  level1SetNumberForUser,
} from "./level1-pack";
import type { ChallengeQuestion } from "../types";

function q(id: string, subjectId: string): ChallengeQuestion {
  return {
    id,
    subjectId,
    stem: id,
    options: ["A", "B", "C", "D"],
    correctIndex: 0,
  };
}

const BANK_12: ChallengeQuestion[] = [
  q("phy", "phy"),
  q("che", "che"),
  q("mat", "mat"),
  q("bio", "bio"),
  q("amat", "amat"),
  q("biotech", "biotech"),
  q("eng", "eng"),
  q("log", "log"),
  q("fin", "fin"),
  q("gk", "gk"),
  q("eco", "eco"),
  q("ent", "ent"),
];

const MATH_LINEUP = [
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
] as const;

describe("level1-pack", () => {
  it("puts new players on set 1 even when the calendar set is not 1", () => {
    const now = new Date("2026-08-31T12:00:00+05:30");
    const calendar = level1SetNumber(now);
    assert.equal(level1SetNumberForUser(null, now), 1);
    assert.notEqual(calendar, 1);
  });

  it("keeps the same set on the first IST day and does not jump to set 2", () => {
    const firstDay = "2026-08-30";
    const morning = new Date("2026-08-30T00:30:00+05:30");
    const night = new Date("2026-08-30T23:30:00+05:30");
    assert.equal(level1SetNumberForUser(firstDay, morning), 1);
    assert.equal(level1SetNumberForUser(firstDay, night), 1);
  });

  it("advances one set on the next IST day", () => {
    assert.equal(
      level1SetNumberForUser("2026-08-30", new Date("2026-08-31T00:30:00+05:30")),
      2,
    );
  });

  it("maps an IST calendar day onto one of 20 shared sets", () => {
    const a = level1SetNumber(new Date("2026-08-29T00:30:00+05:30"));
    const b = level1SetNumber(new Date("2026-08-29T23:30:00+05:30"));
    const c = level1SetNumber(new Date("2026-08-30T00:30:00+05:30"));
    assert.equal(a, b);
    assert.notEqual(a, c);
    assert.ok(a >= 1 && a <= LEVEL1_SET_COUNT);
  });

  it("keeps 10 lineup disciplines and drops the other two", () => {
    const pack = buildLevel1Attempt(BANK_12, {
      lineupIds: [...MATH_LINEUP],
      userId: "user-a",
      setNumber: 1,
    });
    assert.equal(pack.length, 10);
    const ids = pack.map((row) => row.subjectId).sort();
    assert.deepEqual(ids, [...MATH_LINEUP].sort());
    assert.ok(!pack.some((row) => row.subjectId === "bio"));
    assert.ok(!pack.some((row) => row.subjectId === "biotech"));
  });

  it("jumbles the same set differently per user, stably for one user", () => {
    const a1 = buildLevel1Attempt(BANK_12, {
      lineupIds: [...MATH_LINEUP],
      userId: "user-a",
      setNumber: 1,
    }).map((row) => row.id);
    const a2 = buildLevel1Attempt(BANK_12, {
      lineupIds: [...MATH_LINEUP],
      userId: "user-a",
      setNumber: 1,
    }).map((row) => row.id);
    const b1 = buildLevel1Attempt(BANK_12, {
      lineupIds: [...MATH_LINEUP],
      userId: "user-b",
      setNumber: 1,
    }).map((row) => row.id);
    assert.deepEqual(a1, a2);
    assert.notDeepEqual(a1, b1);
    assert.deepEqual([...a1].sort(), [...b1].sort());
  });

  it("hashSeed is deterministic", () => {
    assert.equal(hashSeed("x"), hashSeed("x"));
    assert.notEqual(hashSeed("x"), hashSeed("y"));
  });
});
