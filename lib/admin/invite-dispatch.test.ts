import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  countPlannedStatuses,
  inviteStatusBadgeLabel,
  normalizeInviteEmail,
  planInviteStatuses,
  resolveInviteStatusForRegistration,
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

describe("resolveInviteStatusForRegistration", () => {
  it("marks already-registered EduDeca emails as joined (DONE)", () => {
    assert.equal(resolveInviteStatusForRegistration("sent", true), "joined");
    assert.equal(resolveInviteStatusForRegistration("queued_tomorrow", true), "joined");
    assert.equal(resolveInviteStatusForRegistration("pending", true), "joined");
  });

  it("keeps invite status when email is not registered yet", () => {
    assert.equal(resolveInviteStatusForRegistration("sent", false), "sent");
    assert.equal(resolveInviteStatusForRegistration("joined", false), "joined");
  });
});

describe("inviteStatusBadgeLabel", () => {
  it("shows DONE for joined / already registered", () => {
    assert.equal(inviteStatusBadgeLabel("joined"), "DONE");
  });

  it("keeps Email Sent for sent-only invites", () => {
    assert.equal(inviteStatusBadgeLabel("sent"), "Email Sent");
  });
});
