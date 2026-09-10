import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isStaleAuthRefreshError,
  shouldSkipSessionRefresh,
  withTimeout,
} from "./session-refresh";

describe("session refresh gates", () => {
  it("skips auth refresh on every request so pages never wait on Auth", () => {
    assert.equal(shouldSkipSessionRefresh("/api/challenge/questions"), true);
    assert.equal(shouldSkipSessionRefresh("/challenge"), true);
    assert.equal(shouldSkipSessionRefresh("/home"), true);
    assert.equal(shouldSkipSessionRefresh("/auth/callback"), true);
  });

  it("detects a dead refresh token", () => {
    assert.equal(isStaleAuthRefreshError("refresh_token_not_found", "Invalid Refresh Token"), true);
    assert.equal(isStaleAuthRefreshError("session_not_found", "Invalid JWT"), false);
    assert.equal(isStaleAuthRefreshError("", "session refresh timeout"), true);
  });

  it("times out a hung promise", async () => {
    await assert.rejects(
      () => withTimeout(new Promise(() => undefined), 20),
      /session refresh timeout/,
    );
  });
});
