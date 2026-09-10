import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  LEVEL4_HOME_CTA,
  LEVEL4_PAY_CTA,
  isLevel4Campaign,
  shouldShowLevel4UnlockCta,
} from "./level4-gate-copy";

describe("level4 gate copy", () => {
  it("treats campaign level 4 or a completed free zone at level 3 as the unlock gate", () => {
    assert.equal(isLevel4Campaign(4), true);
    assert.equal(isLevel4Campaign(3), false);
    assert.equal(isLevel4Campaign(3, true), true);
    assert.equal(isLevel4Campaign(5), false);
    assert.equal(isLevel4Campaign(5, true), false);
    assert.equal(shouldShowLevel4UnlockCta(4), true);
    assert.equal(shouldShowLevel4UnlockCta(3), false);
    assert.equal(shouldShowLevel4UnlockCta(3, true), true);
    assert.equal(shouldShowLevel4UnlockCta(5, true), false);
  });

  it("uses priority-access language, not coming-soon-only", () => {
    assert.match(LEVEL4_HOME_CTA, /Unlock Level 4/i);
    assert.match(LEVEL4_HOME_CTA, /Priority access/i);
    assert.doesNotMatch(LEVEL4_HOME_CTA, /coming soon/i);
    assert.match(LEVEL4_PAY_CTA, /₹999/);
    assert.match(LEVEL4_PAY_CTA, /priority access/i);
  });
});
