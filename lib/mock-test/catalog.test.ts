import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { MOCK_LEVELS, formatSetNumber } from "./catalog";

describe("mock test catalog", () => {
  it("pads single-digit set numbers", () => {
    assert.equal(formatSetNumber(1), "01");
    assert.equal(formatSetNumber(20), "20");
  });

  it("uses 10 / 20 / 30 questions for levels 1–3", () => {
    assert.deepEqual(
      MOCK_LEVELS.map((level) => level.questionCount),
      [10, 20, 30],
    );
  });
});
