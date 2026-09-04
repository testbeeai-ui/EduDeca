import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyReturnQuery,
  completedSetCountForLevel,
  createEmptyProgress,
  getSetProgress,
} from "./progress-store";
import {
  buildAttemptUpserts,
  createRemoteRequestGate,
  mergeProgressStates,
  progressFromAttemptRows,
} from "./attempt-sync";

describe("progressFromAttemptRows", () => {
  it("hydrates completed and in-progress cards from the database", () => {
    const state = progressFromAttemptRows([
      {
        level: 2,
        set_number: 1,
        status: "completed",
        score_pct: 80,
        correct: 16,
        total: 20,
        updated_at: "2026-09-01T00:00:00.000Z",
      },
      {
        level: 1,
        set_number: 4,
        status: "inprogress",
        score_pct: null,
        correct: null,
        total: null,
        updated_at: "2026-09-01T00:00:00.000Z",
      },
    ]);
    assert.equal(completedSetCountForLevel(state, 2), 1);
    assert.equal(getSetProgress(state, 2, 1)?.scorePct, 80);
    assert.equal(getSetProgress(state, 1, 4)?.status, "inprogress");
  });
});

describe("mergeProgressStates", () => {
  it("keeps the best completed score and does not downgrade to in progress", () => {
    const local = progressFromAttemptRows([
      {
        level: 1,
        set_number: 3,
        status: "completed",
        score_pct: 70,
        correct: 7,
        total: 10,
        updated_at: "2026-09-01T00:00:00.000Z",
      },
    ]);
    const remote = progressFromAttemptRows([
      {
        level: 1,
        set_number: 3,
        status: "inprogress",
        score_pct: null,
        correct: null,
        total: null,
        updated_at: "2026-09-02T00:00:00.000Z",
      },
    ]);
    const merged = mergeProgressStates(local, remote);
    assert.equal(getSetProgress(merged, 1, 3)?.status, "completed");
    assert.equal(getSetProgress(merged, 1, 3)?.scorePct, 70);
  });

  it("keeps the selected level tab when the other side has Level 1 scores", () => {
    const scored = progressFromAttemptRows([
      {
        level: 1,
        set_number: 1,
        status: "completed",
        score_pct: 80,
        correct: 8,
        total: 10,
        updated_at: "2026-09-01T00:00:00.000Z",
      },
      {
        level: 1,
        set_number: 2,
        status: "completed",
        score_pct: 70,
        correct: 7,
        total: 10,
        updated_at: "2026-09-01T00:00:01.000Z",
      },
      {
        level: 1,
        set_number: 3,
        status: "completed",
        score_pct: 90,
        correct: 9,
        total: 10,
        updated_at: "2026-09-01T00:00:02.000Z",
      },
    ]);
    const local = { lastLevel: 2 as const, sets: scored.sets };
    const merged = mergeProgressStates(scored, local);
    assert.equal(merged.lastLevel, 2);
    assert.equal(completedSetCountForLevel(merged, 1), 3);
  });

  it("does not let a client completed row invent a graded set the database never stored", () => {
    const client = progressFromAttemptRows([
      {
        level: 1,
        set_number: 1,
        status: "completed",
        score_pct: 100,
        correct: 10,
        total: 10,
        updated_at: "2026-09-01T00:00:00.000Z",
      },
    ]);
    const merged = mergeProgressStates(createEmptyProgress(), client);
    assert.equal(getSetProgress(merged, 1, 1), null);
    assert.equal(completedSetCountForLevel(merged, 1), 0);
  });

  it("does not let a client completed score beat the database score", () => {
    const server = progressFromAttemptRows([
      {
        level: 1,
        set_number: 3,
        status: "completed",
        score_pct: 80,
        correct: 8,
        total: 10,
        updated_at: "2026-09-01T00:00:00.000Z",
      },
    ]);
    const client = progressFromAttemptRows([
      {
        level: 1,
        set_number: 3,
        status: "completed",
        score_pct: 100,
        correct: 10,
        total: 10,
        updated_at: "2026-09-02T00:00:00.000Z",
      },
    ]);
    const merged = mergeProgressStates(server, client);
    assert.equal(getSetProgress(merged, 1, 3)?.scorePct, 80);
  });
});

describe("buildAttemptUpserts", () => {
  it("keeps saved answers when the client PUT has no answer map", () => {
    const writes = buildAttemptUpserts(
      [
        {
          level: 2,
          set_number: 6,
          status: "inprogress",
          score_pct: null,
          correct: null,
          total: null,
          answers: { "mock-l2-s06-phy-01": "600 m/s" },
          updated_at: "2026-09-04T00:00:00.000Z",
        },
      ],
      {
        lastLevel: 2,
        sets: {
          "2-6": { status: "inprogress", updatedAt: "2026-09-04T00:00:00.000Z" },
        },
      },
    );
    assert.equal(writes.length, 1);
    assert.equal(writes[0]?.status, "inprogress");
    assert.deepEqual(writes[0]?.answers, { "mock-l2-s06-phy-01": "600 m/s" });
  });

  it("does not persist a client completed status the database has not graded", () => {
    const writes = buildAttemptUpserts([], {
      lastLevel: 1,
      sets: {
        "1-1": {
          status: "completed",
          scorePct: 100,
          correct: 10,
          total: 10,
          updatedAt: "2026-09-04T00:00:00.000Z",
        },
      },
    });
    assert.equal(writes.length, 1);
    assert.equal(writes[0]?.status, "inprogress");
    assert.equal(writes[0]?.score_pct, null);
    assert.equal(writes[0]?.answers, undefined);
  });
});

describe("createRemoteRequestGate", () => {
  it("keeps persist results when a slower GET resolves afterwards", () => {
    const gate = createRemoteRequestGate();
    let remote: ReturnType<typeof createEmptyProgress> | null = null;

    const getId = gate.start();
    const putId = gate.start();

    const persisted = applyReturnQuery(createEmptyProgress(), {
      level: 1,
      set: 1,
      status: "inprogress",
    });
    if (gate.shouldApply(putId)) remote = persisted;

    if (gate.shouldApply(getId)) remote = createEmptyProgress();

    assert.ok(remote);
    assert.equal(getSetProgress(remote, 1, 1)?.status, "inprogress");

    const localCompleted = applyReturnQuery(createEmptyProgress(), {
      level: 1,
      set: 1,
      status: "completed",
      scorePct: 90,
      correct: 9,
      total: 10,
    });
    const display = mergeProgressStates(remote, localCompleted);
    assert.equal(getSetProgress(display, 1, 1)?.status, "inprogress");
  });

  it("still hydrates from GET when persist starts but never applies", () => {
    const gate = createRemoteRequestGate();
    let remote: ReturnType<typeof createEmptyProgress> | null = null;

    const getId = gate.start();
    gate.start();

    const hydrated = applyReturnQuery(createEmptyProgress(), {
      level: 2,
      set: 4,
      status: "inprogress",
    });
    if (gate.shouldApply(getId)) remote = hydrated;

    assert.ok(remote);
    assert.equal(getSetProgress(remote, 2, 4)?.status, "inprogress");

    const retryId = gate.start();
    const persisted = applyReturnQuery(hydrated, {
      level: 2,
      set: 4,
      status: "inprogress",
    });
    if (gate.shouldApply(retryId)) remote = persisted;
    assert.equal(getSetProgress(remote, 2, 4)?.status, "inprogress");
  });
});
