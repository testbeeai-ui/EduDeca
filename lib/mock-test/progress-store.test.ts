import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyReturnQuery,
  completedSetCountForLevel,
  createEmptyProgress,
  getSetProgress,
  parseReturnQuery,
  setLastLevel,
  setProgressKey,
} from "./progress-store";

describe("mock test progress store", () => {
  it("starts with no completed sets", () => {
    const state = createEmptyProgress();
    assert.equal(state.lastLevel, 1);
    assert.equal(completedSetCountForLevel(state, 1), 0);
    assert.equal(getSetProgress(state, 1, 1), null);
  });

  it("merges a completed return query onto that set", () => {
    const query = parseReturnQuery(
      new URLSearchParams("level=2&set=1&score=80&correct=16&total=20&status=completed"),
    );
    assert.ok(query);
    const next = applyReturnQuery(createEmptyProgress(), query, "2026-09-01T00:00:00.000Z");
    assert.equal(next.lastLevel, 2);
    assert.equal(completedSetCountForLevel(next, 2), 1);
    assert.equal(completedSetCountForLevel(next, 1), 0);
    assert.deepEqual(getSetProgress(next, 2, 1), {
      status: "completed",
      scorePct: 80,
      correct: 16,
      total: 20,
      updatedAt: "2026-09-01T00:00:00.000Z",
    });
  });

  it("keeps the higher best score when completing again", () => {
    const first = applyReturnQuery(
      createEmptyProgress(),
      parseReturnQuery(new URLSearchParams("level=1&set=3&score=70&status=completed"))!,
    );
    const second = applyReturnQuery(
      first,
      parseReturnQuery(new URLSearchParams("level=1&set=3&score=55&status=completed"))!,
    );
    assert.equal(getSetProgress(second, 1, 3)?.scorePct, 70);
  });

  it("ignores unknown level or set", () => {
    const empty = createEmptyProgress();
    assert.equal(parseReturnQuery(new URLSearchParams("level=9&set=1&status=completed")), null);
    assert.equal(parseReturnQuery(new URLSearchParams("level=1&set=21&status=completed")), null);
    assert.equal(parseReturnQuery(new URLSearchParams("level=1&set=0&status=completed")), null);
    assert.deepEqual(applyReturnQuery(empty, null), empty);
  });

  it("records in-progress without marking the set completed", () => {
    const next = applyReturnQuery(
      createEmptyProgress(),
      parseReturnQuery(new URLSearchParams("level=1&set=4&status=inprogress"))!,
    );
    assert.equal(getSetProgress(next, 1, 4)?.status, "inprogress");
    assert.equal(completedSetCountForLevel(next, 1), 0);
  });

  it("does not downgrade a completed set to in progress", () => {
    const completed = applyReturnQuery(
      createEmptyProgress(),
      parseReturnQuery(new URLSearchParams("level=1&set=2&score=90&status=completed"))!,
    );
    const next = applyReturnQuery(
      completed,
      parseReturnQuery(new URLSearchParams("level=1&set=2&status=inprogress"))!,
    );
    assert.equal(getSetProgress(next, 1, 2)?.status, "completed");
    assert.equal(getSetProgress(next, 1, 2)?.scorePct, 90);
  });

  it("round-trips lastLevel independently of set progress", () => {
    const next = setLastLevel(createEmptyProgress(), 3);
    assert.equal(next.lastLevel, 3);
    assert.equal(setProgressKey(1, 1), "1-1");
  });
});
