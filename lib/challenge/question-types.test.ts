import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeQuestionType } from "./question-types";

describe("normalizeQuestionType", () => {
  it("returns null when the document has no type", () => {
    assert.equal(normalizeQuestionType(null), null);
    assert.equal(normalizeQuestionType(undefined), null);
    assert.equal(normalizeQuestionType(""), null);
    assert.equal(normalizeQuestionType("  "), null);
  });

  it("stores exactly one trimmed type label", () => {
    assert.equal(
      normalizeQuestionType("  TYPE 1 — VOCABULARY & WORD USAGE  "),
      "TYPE 1 — VOCABULARY & WORD USAGE",
    );
  });
});
