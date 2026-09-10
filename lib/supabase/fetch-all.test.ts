import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { fetchAllPaged } from "./fetch-all";

describe("fetchAllPaged", () => {
  it("concatenates pages until a short page ends the loop", async () => {
    const pages = [
      Array.from({ length: 1000 }, (_, i) => i),
      Array.from({ length: 1000 }, (_, i) => 1000 + i),
      Array.from({ length: 148 }, (_, i) => 2000 + i),
    ];
    let calls = 0;
    const rows = await fetchAllPaged(async (from, to) => {
      const page = pages[calls] ?? [];
      calls += 1;
      assert.equal(to - from + 1, 1000);
      return { data: page, error: null };
    });
    assert.equal(calls, 3);
    assert.equal(rows.length, 2148);
    assert.equal(rows[0], 0);
    assert.equal(rows[2147], 2147);
  });

  it("stops on the first empty page", async () => {
    const rows = await fetchAllPaged(async () => ({ data: [], error: null }));
    assert.deepEqual(rows, []);
  });

  it("throws when a page returns an error", async () => {
    await assert.rejects(
      () =>
        fetchAllPaged(async () => ({
          data: null,
          error: { message: "boom" },
        })),
      /boom/,
    );
  });
});
