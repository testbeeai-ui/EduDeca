import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  ChallengeLoadError,
  loadDailyChallenge,
  shouldRedirectChallengeLoadToSignin,
} from "./load-daily-challenge";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("challenge load gates", () => {
  it("preserves CLASS_LEVEL_REQUIRED without marking it coming soon", async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          error: "Choose Class 11 or Class 12 to start",
          code: "CLASS_LEVEL_REQUIRED",
          comingSoon: true,
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        },
      );

    await assert.rejects(loadDailyChallenge(1), (error: unknown) => {
      assert.ok(error instanceof ChallengeLoadError);
      assert.equal(error.gateCode, "CLASS_LEVEL_REQUIRED");
      assert.equal(error.comingSoon, false);
      return true;
    });
  });

  it("routes authentication and missing-class gates to sign in", () => {
    assert.equal(
      shouldRedirectChallengeLoadToSignin(new ChallengeLoadError("Unauthorized", 401)),
      true,
    );
    assert.equal(
      shouldRedirectChallengeLoadToSignin(
        new ChallengeLoadError("Choose a class", 409, false, "CLASS_LEVEL_REQUIRED"),
      ),
      true,
    );
    assert.equal(
      shouldRedirectChallengeLoadToSignin(
        new ChallengeLoadError("Questions unavailable", 404, true, "QUESTIONS_UNAVAILABLE"),
      ),
      false,
    );
  });
});
