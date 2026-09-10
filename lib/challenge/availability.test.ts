import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { QUESTIONS_UNAVAILABLE, isComingSoonPayload, isLevelReady } from "./availability";

describe("question availability", () => {
  it("recognises the coming-soon API payload", () => {
    assert.equal(isComingSoonPayload({ code: QUESTIONS_UNAVAILABLE }), true);
    assert.equal(isComingSoonPayload({ comingSoon: true }), true);
    assert.equal(isComingSoonPayload({ code: "OTHER" }), false);
  });

  it("treats a missing bank map as unknown, not coming soon", () => {
    assert.equal(isLevelReady(null, 1), null);
  });

  it("treats an explicit empty bank as not ready", () => {
    assert.equal(isLevelReady({ 1: false, 2: false }, 1), false);
  });

  it("treats a full Level 1 bank as ready", () => {
    assert.equal(isLevelReady({ 1: true, 2: false }, 1), true);
  });
});
