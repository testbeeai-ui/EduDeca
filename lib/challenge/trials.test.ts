import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  STUDENT_TRIALS_PER_LEVEL,
  gateStudentLevelAccess,
  isFailOutcome,
  remainingTrials,
  remainingTrialsPayload,
  trialGateFromCode,
  trialsSnapshotFromFailCount,
} from "./trials";

describe("level trials", () => {
  it("gives students 10 fail chances per level", () => {
    assert.equal(STUDENT_TRIALS_PER_LEVEL, 10);
    assert.equal(remainingTrials(0, false), 10);
    assert.equal(remainingTrials(3, false), 7);
    assert.equal(remainingTrials(10, false), 0);
    assert.equal(remainingTrials(99, true), Number.POSITIVE_INFINITY);
    assert.equal(remainingTrialsPayload(3, false), 7);
    assert.equal(remainingTrialsPayload(10, false), 0);
    assert.equal(remainingTrialsPayload(99, true), null);
  });

  it("maps API codes back to gate reasons", () => {
    assert.equal(trialGateFromCode("LEVEL_PASSED"), "level_passed");
    assert.equal(trialGateFromCode("LEVEL_LOCKED_AHEAD"), "level_locked_ahead");
    assert.equal(trialGateFromCode("DAILY_LOCK"), "daily_lock");
    assert.equal(trialGateFromCode("TRIALS_EXHAUSTED"), "trials_exhausted");
    assert.equal(trialGateFromCode("NOPE"), null);
  });

  it("lets a student retry after 9 fails", () => {
    assert.equal(
      gateStudentLevelAccess({
        requestedLevel: 1,
        campaignLevel: 1,
        todayCompleted: false,
        failCount: 9,
        unlimited: false,
      }),
      "ok",
    );
  });

  it("blocks going back to a passed level", () => {
    assert.equal(
      gateStudentLevelAccess({
        requestedLevel: 1,
        campaignLevel: 2,
        todayCompleted: false,
        failCount: 0,
        unlimited: false,
      }),
      "level_passed",
    );
  });

  it("blocks skipping ahead", () => {
    assert.equal(
      gateStudentLevelAccess({
        requestedLevel: 2,
        campaignLevel: 1,
        todayCompleted: false,
        failCount: 0,
        unlimited: false,
      }),
      "level_locked_ahead",
    );
  });

  it("locks the next level until tomorrow after a pass", () => {
    assert.equal(
      gateStudentLevelAccess({
        requestedLevel: 2,
        campaignLevel: 2,
        todayCompleted: true,
        failCount: 0,
        unlimited: false,
      }),
      "daily_lock",
    );
  });

  it("stops students after 10 fails on the current level", () => {
    assert.equal(
      gateStudentLevelAccess({
        requestedLevel: 1,
        campaignLevel: 1,
        todayCompleted: false,
        failCount: 10,
        unlimited: false,
      }),
      "trials_exhausted",
    );
  });

  it("lets testers replay any free-zone level", () => {
    assert.equal(
      gateStudentLevelAccess({
        requestedLevel: 1,
        campaignLevel: 3,
        todayCompleted: true,
        failCount: 99,
        unlimited: true,
      }),
      "ok",
    );
  });

  it("counts strikes/time as fails and ignores quit/win", () => {
    assert.equal(isFailOutcome("strikes"), true);
    assert.equal(isFailOutcome("time"), true);
    assert.equal(isFailOutcome("below_threshold"), true);
    assert.equal(isFailOutcome("won"), false);
    assert.equal(isFailOutcome("quit"), false);
  });

  it("builds a student snapshot after the 4th fail", () => {
    const snap = trialsSnapshotFromFailCount({
      failCount: 4,
      unlimited: false,
      requestedLevel: 1,
      campaignLevel: 1,
      todayCompleted: false,
    });
    assert.equal(snap.failCount, 4);
    assert.equal(snap.remaining, 6);
    assert.equal(snap.limit, 10);
    assert.equal(snap.gate, "ok");
    assert.equal(snap.unlimited, false);
  });

  it("marks the student not eligible after 10 fails", () => {
    const snap = trialsSnapshotFromFailCount({
      failCount: 10,
      unlimited: false,
      requestedLevel: 1,
      campaignLevel: 1,
      todayCompleted: false,
    });
    assert.equal(snap.remaining, 0);
    assert.equal(snap.gate, "trials_exhausted");
  });

  it("serializes tester remaining as null", () => {
    const snap = trialsSnapshotFromFailCount({
      failCount: 99,
      unlimited: true,
      requestedLevel: 1,
      campaignLevel: 1,
      todayCompleted: true,
    });
    assert.equal(snap.remaining, null);
    assert.equal(snap.unlimited, true);
    assert.equal(snap.gate, "ok");
  });
});
