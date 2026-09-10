import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  LEVEL4_HOME_CTA,
  LEVEL4_PAY_CTA,
  isLevel4Campaign,
  shouldShowLevel4UnlockCta,
} from "./level4-gate-copy";

describe("level4 gate copy", () => {
  it("treats only campaign level 4 as the unlock gate", () => {
    assert.equal(isLevel4Campaign(4), true);
    assert.equal(isLevel4Campaign(3), false);
    assert.equal(isLevel4Campaign(5), false);
    assert.equal(shouldShowLevel4UnlockCta(4), true);
    assert.equal(shouldShowLevel4UnlockCta(3), false);
  });

  it("uses priority-access language, not coming-soon-only", () => {
    assert.match(LEVEL4_HOME_CTA, /Unlock Level 4/i);
    assert.match(LEVEL4_HOME_CTA, /Priority access/i);
    assert.doesNotMatch(LEVEL4_HOME_CTA, /coming soon/i);
    assert.match(LEVEL4_PAY_CTA, /₹999/);
    assert.match(LEVEL4_PAY_CTA, /priority access/i);
  });
});
