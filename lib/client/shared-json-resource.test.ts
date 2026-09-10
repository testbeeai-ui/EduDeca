import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createSharedJsonResource } from "./shared-json-resource";

describe("createSharedJsonResource", () => {
  it("shares one in-flight fetch across overlapping callers", async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return new Response(JSON.stringify({ ready: { 1: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const resource = createSharedJsonResource({
      url: "/api/challenge/availability",
      ttlMs: 30_000,
      fetchImpl,
      parse: async (res) => {
        if (!res.ok) return null;
        const body = (await res.json()) as { ready?: { 1: boolean } };
        return body.ready ?? null;
      },
    });

    const [a, b, c] = await Promise.all([resource.load(), resource.load(), resource.load()]);
    assert.equal(calls, 1);
    assert.deepEqual(a, { 1: true });
    assert.deepEqual(b, { 1: true });
    assert.deepEqual(c, { 1: true });
  });

  it("reuses a fresh cache instead of refetching", async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    };

    const resource = createSharedJsonResource({
      url: "/api/x",
      ttlMs: 30_000,
      fetchImpl,
      parse: async (res) => (res.ok ? ((await res.json()) as { ok: boolean }) : null),
    });

    await resource.load();
    await resource.load();
    assert.equal(calls, 1);
  });
});
