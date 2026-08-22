import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ADMIN_FEEDBACK_MAX_CHARS,
  buildVerificationDecision,
  normalizeAdminFeedback,
} from "./verification-decision";

describe("normalizeAdminFeedback", () => {
  it("returns null for blank input", () => {
    assert.equal(normalizeAdminFeedback("   "), null);
    assert.equal(normalizeAdminFeedback(null), null);
  });

  it("trims and keeps a short message", () => {
    assert.equal(
      normalizeAdminFeedback("  this is not the right way  "),
      "this is not the right way",
    );
  });

  it("caps length at ADMIN_FEEDBACK_MAX_CHARS", () => {
    const long = "x".repeat(ADMIN_FEEDBACK_MAX_CHARS + 50);
    const out = normalizeAdminFeedback(long);
    assert.equal(out?.length, ADMIN_FEEDBACK_MAX_CHARS);
  });
});

describe("buildVerificationDecision", () => {
  const now = "2026-08-22T10:00:00.000Z";

  it("approves and clears rejectedAt", () => {
    assert.deepEqual(
      buildVerificationDecision({ action: "approve", nowIso: now }),
      {
        status: "approved",
        verifiedAt: now,
        rejectedAt: null,
      },
    );
  });

  it("rejects with optional feedback", () => {
    assert.deepEqual(
      buildVerificationDecision({
        action: "reject",
        comment: "this is not the right way",
        nowIso: now,
      }),
      {
        status: "rejected",
        verifiedAt: null,
        rejectedAt: now,
        adminFeedback: "this is not the right way",
        adminFeedbackAt: now,
      },
    );
  });

  it("comment-only requires non-empty feedback", () => {
    assert.throws(
      () => buildVerificationDecision({ action: "comment", comment: "  " }),
      /Comment text is required/,
    );
    assert.deepEqual(
      buildVerificationDecision({
        action: "comment",
        comment: "Please re-upload Class XI roster",
        nowIso: now,
      }),
      {
        adminFeedback: "Please re-upload Class XI roster",
        adminFeedbackAt: now,
      },
    );
  });
});
