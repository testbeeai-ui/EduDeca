import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  countPlannedStatuses,
  normalizeInviteEmail,
  planInviteStatuses,
} from "./invite-dispatch";

describe("normalizeInviteEmail", () => {
  it("trims and lowercases", () => {
    assert.equal(normalizeInviteEmail("  Alex@College.EDU "), "alex@college.edu");
  });
});

describe("planInviteStatuses", () => {
  it("marks first dailyLimit as sent and the rest queued", () => {
    assert.deepEqual(planInviteStatuses(5, 3), [
      "sent",
      "sent",
      "sent",
      "queued_tomorrow",
      "queued_tomorrow",
    ]);
  });

  it("queues all when dailyLimit is 0", () => {
    assert.deepEqual(planInviteStatuses(2, 0), [
      "queued_tomorrow",
      "queued_tomorrow",
    ]);
  });

  it("sends all when under the limit", () => {
    assert.deepEqual(planInviteStatuses(2, 100), ["sent", "sent"]);
  });
});

describe("countPlannedStatuses", () => {
  it("counts sent vs queued", () => {
    assert.deepEqual(countPlannedStatuses(planInviteStatuses(4, 1)), {
      sentCount: 1,
      queuedCount: 3,
    });
  });
});
