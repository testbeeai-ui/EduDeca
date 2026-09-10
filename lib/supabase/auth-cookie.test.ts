import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  hasLiveAccessToken,
  hasRefreshableSession,
  persistAuthCookieOptions,
} from "./auth-cookie";

function jwtWithExp(exp: number): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: "u1", exp })).toString("base64url");
  return `${header}.${payload}.x`;
}

describe("hasLiveAccessToken", () => {
  it("rejects missing cookies", () => {
    assert.equal(hasLiveAccessToken([]), false);
  });

  it("accepts a session that has not expired", () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const value = JSON.stringify({
      access_token: jwtWithExp(exp),
      refresh_token: "r",
      expires_at: exp,
    });
    assert.equal(
      hasLiveAccessToken([{ name: "sb-proj-auth-token", value }]),
      true,
    );
  });

  it("rejects an expired session without calling Auth", () => {
    const exp = Math.floor(Date.now() / 1000) - 60;
    const value = JSON.stringify({
      access_token: jwtWithExp(exp),
      refresh_token: "r",
      expires_at: exp,
    });
    assert.equal(
      hasLiveAccessToken([{ name: "sb-proj-auth-token", value }]),
      false,
    );
  });
});

describe("hasRefreshableSession", () => {
  it("keeps an expired access token when a refresh token is present", () => {
    const exp = Math.floor(Date.now() / 1000) - 60;
    const value = JSON.stringify({
      access_token: jwtWithExp(exp),
      refresh_token: "refresh-still-valid",
      expires_at: exp,
    });
    assert.equal(
      hasRefreshableSession([{ name: "sb-proj-auth-token", value }]),
      true,
    );
  });

  it("rejects cookies with no refresh token", () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const value = JSON.stringify({
      access_token: jwtWithExp(exp),
      expires_at: exp,
    });
    assert.equal(
      hasRefreshableSession([{ name: "sb-proj-auth-token", value }]),
      false,
    );
  });
});

describe("persistAuthCookieOptions", () => {
  it("keeps maxAge 0 so logout can delete cookies", () => {
    assert.equal(persistAuthCookieOptions({ maxAge: 0 }).maxAge, 0);
  });

  it("stamps a long-lived maxAge so laptop shutdown does not drop the session", () => {
    const next = persistAuthCookieOptions({ path: "/" });
    assert.ok((next.maxAge ?? 0) >= 60 * 60 * 24 * 30);
    assert.equal(next.path, "/");
    assert.equal(next.sameSite, "lax");
  });
});
