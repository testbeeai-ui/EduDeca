import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_EMAIL_DAILY_SEND_CAP,
  getEmailDailySendCap,
  getIstCalendarDateIso,
  resolveSharedEmailQuotaCounts,
} from "./emailDailyCap";

describe("getEmailDailySendCap", () => {
  it("defaults to 500 like EduBlast when env unset", () => {
    const prev = process.env.EMAIL_DAILY_SEND_CAP;
    delete process.env.EMAIL_DAILY_SEND_CAP;
    try {
      assert.equal(getEmailDailySendCap(), DEFAULT_EMAIL_DAILY_SEND_CAP);
      assert.equal(getEmailDailySendCap(), 500);
    } finally {
      if (prev !== undefined) process.env.EMAIL_DAILY_SEND_CAP = prev;
      else delete process.env.EMAIL_DAILY_SEND_CAP;
    }
  });

  it("reads EMAIL_DAILY_SEND_CAP from env", () => {
    const prev = process.env.EMAIL_DAILY_SEND_CAP;
    process.env.EMAIL_DAILY_SEND_CAP = "500";
    try {
      assert.equal(getEmailDailySendCap(), 500);
    } finally {
      if (prev !== undefined) process.env.EMAIL_DAILY_SEND_CAP = prev;
      else delete process.env.EMAIL_DAILY_SEND_CAP;
    }
  });
});

describe("getIstCalendarDateIso", () => {
  it("returns YYYY-MM-DD", () => {
    assert.match(getIstCalendarDateIso(), /^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("resolveSharedEmailQuotaCounts", () => {
  it("fail-closes when the sent count is unknown", () => {
    assert.deepEqual(resolveSharedEmailQuotaCounts(500, null), {
      sentToday: 500,
      remainingToday: 0,
    });
  });

  it("computes remaining when the sent count is known", () => {
    assert.deepEqual(resolveSharedEmailQuotaCounts(500, 12), {
      sentToday: 12,
      remainingToday: 488,
    });
  });
});
