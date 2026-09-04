import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { edublastAppOrigin, edublastMockHandoffUrl } from "./handoff";
import { parseReturnQuery } from "./progress-store";

describe("EduBlast mock handoff URL", () => {
  it("defaults to the live EduBlast site when the env is blank", () => {
    assert.equal(edublastAppOrigin(""), "https://www.edublast.in");
    assert.equal(edublastAppOrigin("   "), "https://www.edublast.in");
    assert.equal(
      edublastMockHandoffUrl(1, 1, ""),
      "https://www.edublast.in/edudeca-mock?level=1&set=1",
    );
  });

  it("does not send a public EduDeca page to localhost Web", () => {
    assert.equal(
      edublastAppOrigin("http://localhost:3000", "edudeca.vercel.app"),
      "https://www.edublast.in",
    );
  });

  it("opens /edudeca-mock with the selected level and set", () => {
    assert.equal(
      edublastMockHandoffUrl(2, 1, "http://localhost:3000"),
      "http://localhost:3000/edudeca-mock?level=2&set=1",
    );
  });

  it("strips a trailing slash from the origin", () => {
    assert.equal(
      edublastMockHandoffUrl(1, 20, "https://www.edublast.in/"),
      "https://www.edublast.in/edudeca-mock?level=1&set=20",
    );
  });

  it("parses the completed return URL EduBlast actually sends", () => {
    const url = new URL(
      "http://localhost:3001/mock-test?level=2&set=1&score=80&correct=16&total=20&status=completed",
    );
    assert.deepEqual(parseReturnQuery(url.searchParams), {
      level: 2,
      set: 1,
      status: "completed",
      scorePct: 80,
      correct: 16,
      total: 20,
    });
  });

  it("parses the in-progress return URL EduBlast actually sends", () => {
    const url = new URL("http://localhost:3001/mock-test?level=1&set=4&status=inprogress");
    assert.deepEqual(parseReturnQuery(url.searchParams), {
      level: 1,
      set: 4,
      status: "inprogress",
      scorePct: undefined,
      correct: undefined,
      total: undefined,
    });
  });
});
