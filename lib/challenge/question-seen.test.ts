import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  matchesStudentClass,
  outcomeFromSeenCard,
  pickUnseenRound,
  poolGroupKey,
  seenInsertsFromRun,
  type PoolItem,
} from "./question-seen";

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

const LINEUP = [
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

function fullBank(): PoolItem[] {
  return LINEUP.flatMap((disc) => [
    item(`${disc}-a`, disc),
    item(`${disc}-b`, disc),
    item(`${disc}-c`, disc),
  ]);
}

describe("outcomeFromSeenCard", () => {
  it("marks a correct answer as seen-correct", () => {
    assert.equal(
      outcomeFromSeenCard({
        questionId: "phy-a",
        disciplineId: "phy",
        isCorrect: true,
      }),
      "correct",
    );
  });

  it("marks a wrong answer as seen-wrong", () => {
    assert.equal(
      outcomeFromSeenCard({
        questionId: "log-a",
        disciplineId: "log",
        isCorrect: false,
      }),
      "wrong",
    );
  });

  it("marks skip and timer-skip as seen-skip", () => {
    assert.equal(
      outcomeFromSeenCard({
        questionId: "gk-a",
        disciplineId: "gk",
        isCorrect: false,
        skipped: true,
      }),
      "skip",
    );
  });
});

describe("seenInsertsFromRun", () => {
  it("records every submitted card on a fail, including skips", () => {
    const rows = seenInsertsFromRun({
      level: 1,
      reason: "strikes",
      results: [
        { questionId: "phy-a", disciplineId: "phy", isCorrect: true },
        { questionId: "log-a", disciplineId: "log", isCorrect: false },
        { questionId: "gk-a", disciplineId: "gk", isCorrect: false, skipped: true },
      ],
    });
    assert.deepEqual(
      rows.map((r) => [r.questionId, r.outcome, r.level, r.disciplineId]),
      [
        ["phy-a", "correct", 1, "phy"],
        ["log-a", "wrong", 1, "log"],
        ["gk-a", "skip", 1, "gk"],
      ],
    );
  });

  it("records submitted cards on a pass without treating that as a fail ledger", () => {
    const rows = seenInsertsFromRun({
      level: 1,
      reason: "won",
      results: [{ questionId: "phy-a", disciplineId: "phy", isCorrect: true }],
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.outcome, "correct");
  });

  it("records only submitted cards on quit, not the leftover unasked ones", () => {
    const rows = seenInsertsFromRun({
      level: 1,
      reason: "quit",
      results: [{ questionId: "phy-a", disciplineId: "phy", isCorrect: false }],
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.questionId, "phy-a");
  });

  it("records nothing when they quit before answering a card", () => {
    const rows = seenInsertsFromRun({
      level: 1,
      reason: "quit",
      results: [],
    });
    assert.deepEqual(rows, []);
  });

  it("keeps one insert when the same question id appears twice", () => {
    const rows = seenInsertsFromRun({
      level: 1,
      reason: "won",
      results: [
        { questionId: "phy-a", disciplineId: "phy", isCorrect: true },
        { questionId: "phy-a", disciplineId: "phy", isCorrect: false },
      ],
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.outcome, "correct");
  });
});

describe("pickUnseenRound", () => {
  it("picks exactly one question per lineup discipline", () => {
    const round = pickUnseenRound({
      bank: fullBank(),
      lineupIds: LINEUP,
      seenIds: new Set(),
      level: 1,
      seed: 7,
      studentClass: "XI",
      perDiscipline: 1,
    });
    assert.equal(round.ok, true);
    if (!round.ok) return;
    assert.equal(round.questions.length, 10);
    const discs = round.questions.map((q) => q.disciplineId);
    assert.deepEqual([...discs].sort(), [...LINEUP].sort());
    assert.equal(new Set(discs).size, 10);
  });

  it("never returns two Analytical questions in one round", () => {
    const bank = [
      item("log-1", "log"),
      item("log-2", "log"),
      item("log-3", "log"),
      ...LINEUP.filter((d) => d !== "log").map((d) => item(`${d}-1`, d)),
    ];
    const round = pickUnseenRound({
      bank,
      lineupIds: LINEUP,
      seenIds: new Set(),
      level: 1,
      seed: 3,
      studentClass: "XI",
      perDiscipline: 1,
    });
    assert.equal(round.ok, true);
    if (!round.ok) return;
    const logs = round.questions.filter((q) => q.disciplineId === "log");
    assert.equal(logs.length, 1);
  });

  it("does not repeat a question this student already saw", () => {
    const round = pickUnseenRound({
      bank: fullBank(),
      lineupIds: LINEUP,
      seenIds: new Set(["phy-a", "phy-b"]),
      level: 1,
      seed: 1,
      studentClass: "XI",
      perDiscipline: 1,
    });
    assert.equal(round.ok, true);
    if (!round.ok) return;
    const phy = round.questions.find((q) => q.disciplineId === "phy");
    assert.equal(phy?.id, "phy-c");
  });

  it("lets another student still receive a question Asha already saw", () => {
    const asha = pickUnseenRound({
      bank: [item("log-1", "log"), ...LINEUP.filter((d) => d !== "log").map((d) => item(`${d}-1`, d))],
      lineupIds: LINEUP,
      seenIds: new Set(["log-1"]),
      level: 1,
      seed: 2,
      studentClass: "XI",
      perDiscipline: 1,
    });
    const ravi = pickUnseenRound({
      bank: [item("log-1", "log"), ...LINEUP.filter((d) => d !== "log").map((d) => item(`${d}-1`, d))],
      lineupIds: LINEUP,
      seenIds: new Set(),
      level: 1,
      seed: 2,
      studentClass: "XI",
      perDiscipline: 1,
    });
    assert.equal(asha.ok, false);
    assert.equal(ravi.ok, true);
    if (!ravi.ok) return;
    assert.equal(ravi.questions.find((q) => q.disciplineId === "log")?.id, "log-1");
  });

  it("does not mix Level 2 items into a Level 1 round", () => {
    const bank = [
      item("phy-l2", "phy", { level: 2 }),
      ...LINEUP.map((d) => item(`${d}-l1`, d, { level: 1 })),
    ];
    const round = pickUnseenRound({
      bank,
      lineupIds: LINEUP,
      seenIds: new Set(),
      level: 1,
      seed: 4,
      studentClass: "XI",
      perDiscipline: 1,
    });
    assert.equal(round.ok, true);
    if (!round.ok) return;
    assert.ok(round.questions.every((q) => q.level === 1));
    assert.ok(!round.questions.some((q) => q.id === "phy-l2"));
  });

  it("does not serve unpublished questions", () => {
    const bank = [
      item("phy-hidden", "phy", { published: false }),
      ...LINEUP.map((d) => item(`${d}-ok`, d)),
    ];
    const round = pickUnseenRound({
      bank,
      lineupIds: LINEUP,
      seenIds: new Set(),
      level: 1,
      seed: 5,
      studentClass: "XI",
      perDiscipline: 1,
    });
    assert.equal(round.ok, true);
    if (!round.ok) return;
    assert.ok(!round.questions.some((q) => q.id === "phy-hidden"));
  });

  it("fails the round build when a discipline pool is exhausted", () => {
    const bank = LINEUP.filter((d) => d !== "log").map((d) => item(`${d}-1`, d));
    const round = pickUnseenRound({
      bank,
      lineupIds: LINEUP,
      seenIds: new Set(),
      level: 1,
      seed: 6,
      studentClass: "XI",
      perDiscipline: 1,
    });
    assert.equal(round.ok, false);
    if (round.ok) return;
    assert.deepEqual(round.missing, ["log"]);
  });

  it("shuffles round order so the first card is not always Physics", () => {
    const orders = new Set<string>();
    for (let seed = 1; seed <= 20; seed += 1) {
      const round = pickUnseenRound({
        bank: fullBank(),
        lineupIds: LINEUP,
        seenIds: new Set(),
        level: 1,
        seed,
        studentClass: "XI",
        perDiscipline: 1,
      });
      assert.equal(round.ok, true);
      if (!round.ok) return;
      orders.add(round.questions[0]?.disciplineId ?? "");
    }
    assert.ok(orders.size > 1);
  });
});

describe("poolGroupKey", () => {
  it("prefers type over chapter", () => {
    assert.equal(
      poolGroupKey(item("a", "eng", { type: "TYPE 1 — VOCAB", chapter: "CH 1" })),
      "TYPE 1 — VOCAB",
    );
  });

  it("falls back to chapter for CBSE rows", () => {
    assert.equal(
      poolGroupKey(item("a", "bio", { type: null, chapter: "1. BIOLOGICAL CLASSIFICATION" })),
      "1. BIOLOGICAL CLASSIFICATION",
    );
  });
});

describe("matchesStudentClass", () => {
  it("keeps null class_level for both XI and XII", () => {
    assert.equal(matchesStudentClass(item("a", "eng", { classLevel: null }), "XI"), true);
    assert.equal(matchesStudentClass(item("a", "eng", { classLevel: null }), "XII"), true);
  });

  it("keeps only matching CBSE class", () => {
    assert.equal(matchesStudentClass(item("a", "bio", { classLevel: "XI" }), "XI"), true);
    assert.equal(matchesStudentClass(item("a", "bio", { classLevel: "XII" }), "XI"), false);
  });
});

describe("pickUnseenRound groups", () => {
  function groupedBank(level: number, perGroup: number): PoolItem[] {
    return LINEUP.flatMap((disc) => {
      const isCbse = ["phy", "che", "mat", "amat"].includes(disc);
      return [1, 2, 3, 4].flatMap((g) =>
        Array.from({ length: perGroup }, (_, i) =>
          item(`${disc}-g${g}-${i}`, disc, {
            level,
            type: isCbse ? null : `TYPE ${g} — X`,
            chapter: isCbse ? `CHAPTER ${g} — X` : null,
            classLevel: isCbse ? "XI" : null,
          }),
        ),
      );
    });
  }

  it("Level 2 returns 2 questions per discipline from 2 different groups (20 cards)", () => {
    const round = pickUnseenRound({
      bank: groupedBank(2, 3),
      lineupIds: LINEUP,
      seenIds: new Set(),
      level: 2,
      seed: 11,
      studentClass: "XI",
      perDiscipline: 2,
    });
    assert.equal(round.ok, true);
    if (!round.ok) return;
    assert.equal(round.questions.length, 20);
    for (const disc of LINEUP) {
      const qs: PoolItem[] = round.questions.filter(
        (q: PoolItem) => q.disciplineId === disc,
      );
      assert.equal(qs.length, 2);
      const keys = qs.map((q) => poolGroupKey(q));
      assert.equal(new Set(keys).size, 2);
    }
  });

  it("Level 3 returns 3 questions per discipline from 3 different groups (30 cards)", () => {
    const round = pickUnseenRound({
      bank: groupedBank(3, 2),
      lineupIds: LINEUP,
      seenIds: new Set(),
      level: 3,
      seed: 9,
      studentClass: "XI",
      perDiscipline: 3,
    });
    assert.equal(round.ok, true);
    if (!round.ok) return;
    assert.equal(round.questions.length, 30);
    for (const disc of LINEUP) {
      const qs: PoolItem[] = round.questions.filter(
        (q: PoolItem) => q.disciplineId === disc,
      );
      assert.equal(qs.length, 3);
      assert.equal(new Set(qs.map((q) => poolGroupKey(q))).size, 3);
    }
  });

  it("never serves XII rows to an XI student but still serves untagged aptitude", () => {
    const bank = [
      item("bio-xi", "bio", { level: 1, type: null, chapter: "CH1", classLevel: "XI" }),
      item("bio-xii", "bio", { level: 1, type: null, chapter: "CH1", classLevel: "XII" }),
      item("eng-1", "eng", { level: 1, type: "TYPE 1 — V", classLevel: null }),
      ...LINEUP.filter((d) => d !== "eng").map((d) =>
        item(`${d}-1`, d, { level: 1, type: "TYPE 1 — X", classLevel: null }),
      ),
    ];
    const round = pickUnseenRound({
      bank,
      lineupIds: ["bio", ...LINEUP],
      seenIds: new Set(),
      level: 1,
      seed: 2,
      studentClass: "XI",
      perDiscipline: 1,
    });
    assert.equal(round.ok, true);
    if (!round.ok) return;
    assert.equal(round.questions.find((q) => q.disciplineId === "bio")?.id, "bio-xi");
    assert.equal(round.questions.find((q) => q.disciplineId === "eng")?.id, "eng-1");
  });

  it("fails when a discipline has fewer than N distinct groups left", () => {
    const bank = LINEUP.flatMap((disc) => [
      item(`${disc}-a`, disc, { level: 2, type: "TYPE 1 — X", classLevel: null }),
      item(`${disc}-b`, disc, { level: 2, type: "TYPE 1 — X", classLevel: null }),
    ]);
    const round = pickUnseenRound({
      bank,
      lineupIds: LINEUP,
      seenIds: new Set(),
      level: 2,
      seed: 1,
      studentClass: "XI",
      perDiscipline: 2,
    });
    assert.equal(round.ok, false);
  });

  it("does not reuse a seen question even when its group still has other items", () => {
    const bank = LINEUP.flatMap((disc) => [
      item(`${disc}-a`, disc, { level: 1, type: "TYPE 1 — X", classLevel: null }),
      item(`${disc}-b`, disc, { level: 1, type: "TYPE 1 — X", classLevel: null }),
    ]);
    const round = pickUnseenRound({
      bank,
      lineupIds: LINEUP,
      seenIds: new Set(LINEUP.map((d) => `${d}-a`)),
      level: 1,
      seed: 3,
      studentClass: "XI",
      perDiscipline: 1,
    });
    assert.equal(round.ok, true);
    if (!round.ok) return;
    assert.ok(round.questions.every((q) => q.id.endsWith("-b")));
  });
});
