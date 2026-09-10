import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { failAttemptsPanel, failOutcomeHeadline, LEVEL_ATTEMPTS_HINT } from "./attempts-copy";

describe("failAttemptsPanel", () => {
  it("shows the student 10-attempt rule on tester fails", () => {
    const panel = failAttemptsPanel({
      reason: "strikes",
      remaining: null,
      failCount: 3,
      unlimited: true,
      limit: 10,
    });
    assert.equal(panel?.unlimited, true);
    assert.equal(panel?.exhausted, false);
    assert.equal(panel?.used, 3);
    assert.equal(panel?.hint, LEVEL_ATTEMPTS_HINT);
    assert.equal(panel?.description, "3 fails recorded on this level. You can still retry.");
  });

  it("hides on win", () => {
    assert.equal(
      failAttemptsPanel({
        reason: "won",
        remaining: 9,
        unlimited: false,
        limit: 10,
      }),
      null,
    );
  });

  it("does not use an attempt when the student quits mid-round", () => {
    const panel = failAttemptsPanel({
      reason: "quit",
      remaining: 7,
      failCount: 3,
      unlimited: false,
      limit: 10,
    });
    assert.equal(panel?.exhausted, false);
    assert.equal(panel?.remaining, 7);
    assert.equal(
      panel?.description,
      "Leaving mid-round does not use an attempt. You still have 7 of 10 on this level.",
    );
  });

  it("shows remaining after a fail", () => {
    const panel = failAttemptsPanel({
      reason: "strikes",
      remaining: 6,
      unlimited: false,
      limit: 10,
    });
    assert.deepEqual(panel, {
      used: 4,
      remaining: 6,
      limit: 10,
      exhausted: false,
      unlimited: false,
      title: "Level attempts",
      description: "6 of 10 attempts left on this level.",
      hint: LEVEL_ATTEMPTS_HINT,
    });
  });

  it("closes the level at 0 remaining", () => {
    const panel = failAttemptsPanel({
      reason: "time",
      remaining: 0,
      unlimited: false,
      limit: 10,
    });
    assert.equal(panel?.exhausted, true);
    assert.equal(panel?.used, 10);
    assert.equal(
      panel?.description,
      "0 of 10 attempts left. You cannot attempt this level again.",
    );
  });
});

describe("failOutcomeHeadline", () => {
  it("treats 10 failed attempts as a closed level", () => {
    const copy = failOutcomeHeadline({
      reason: "strikes",
      exhausted: true,
      level: 1,
      maxStrikes: 5,
      correct: 2,
      total: 10,
    });
    assert.equal(copy?.title, "No attempts left");
    assert.match(copy?.description ?? "", /closed for your account/);
  });

  it("keeps the strike title when attempts remain", () => {
    const copy = failOutcomeHeadline({
      reason: "strikes",
      exhausted: false,
      level: 1,
      maxStrikes: 5,
      correct: 2,
      total: 10,
    });
    assert.equal(copy?.title, "5 strikes limit reached");
    assert.match(copy?.description ?? "", /one of your 10 attempts/);
  });
});
