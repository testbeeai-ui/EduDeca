import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { challengeGroupBadgeLabel } from "./meta";

describe("challengeGroupBadgeLabel", () => {
  it("prefers TYPE when present", () => {
    assert.equal(
      challengeGroupBadgeLabel({
        type: "TYPE 1 — VOCABULARY & WORD USAGE",
        chapter: "1. BIOLOGICAL CLASSIFICATION",
      }),
      "TYPE 1 — VOCABULARY & WORD USAGE",
    );
  });

  it("uses chapter when type is absent (CBSE banks)", () => {
    assert.equal(
      challengeGroupBadgeLabel({
        type: null,
        chapter: "1. BIOLOGICAL CLASSIFICATION",
      }),
      "1. BIOLOGICAL CLASSIFICATION",
    );
  });

  it("returns null when neither type nor chapter is set", () => {
    assert.equal(challengeGroupBadgeLabel({ type: null, chapter: null }), null);
    assert.equal(challengeGroupBadgeLabel({}), null);
  });

  it("trims whitespace and ignores blank strings", () => {
    assert.equal(
      challengeGroupBadgeLabel({ type: "  ", chapter: "  Units & Measurements  " }),
      "Units & Measurements",
    );
  });
});
