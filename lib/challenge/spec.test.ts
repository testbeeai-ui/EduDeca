import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  challengeGroupsPerDiscipline,
  challengeMaxStrikes,
  challengeQuestionCount,
  challengeSessionDurationSec,
} from "./spec";

describe("challenge timing", () => {
  it("uses a whole-level clock: 5 / 10 / 20 minutes", () => {
    assert.equal(challengeSessionDurationSec(1), 5 * 60);
    assert.equal(challengeSessionDurationSec(2), 10 * 60);
    assert.equal(challengeSessionDurationSec(3), 20 * 60);
  });
});

describe("challenge round shape", () => {
  it("uses 10 / 20 / 30 cards and 1 / 2 / 3 groups per discipline", () => {
    assert.equal(challengeQuestionCount(1), 10);
    assert.equal(challengeQuestionCount(2), 20);
    assert.equal(challengeQuestionCount(3), 30);
    assert.equal(challengeGroupsPerDiscipline(1), 1);
    assert.equal(challengeGroupsPerDiscipline(2), 2);
    assert.equal(challengeGroupsPerDiscipline(3), 3);
  });

  it("uses 5 / 7 / 10 strikes on Levels 1 / 2 / 3", () => {
    assert.equal(challengeMaxStrikes(1), 5);
    assert.equal(challengeMaxStrikes(2), 7);
    assert.equal(challengeMaxStrikes(3), 10);
  });
});
