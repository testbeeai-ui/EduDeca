import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isEduDecaStudentEstablished } from "./returning-login";

describe("isEduDecaStudentEstablished", () => {
  it("rejects empty brand-new snapshots", () => {
    assert.equal(
      isEduDecaStudentEstablished({
        classLevel: null,
        institutionName: null,
        disciplines: null,
        xp: 0,
        campaignLevel: 1,
      }),
      false,
    );
  });

  it("accepts class + institution", () => {
    assert.equal(
      isEduDecaStudentEstablished({
        classLevel: 11,
        institutionName: "PCCOE",
        disciplines: null,
        xp: 0,
        campaignLevel: 1,
      }),
      true,
    );
  });

  it("accepts a full 10-discipline lineup", () => {
    assert.equal(
      isEduDecaStudentEstablished({
        classLevel: null,
        institutionName: "",
        disciplines: Array.from({ length: 10 }, (_, i) => `d${i}`),
        xp: 0,
        campaignLevel: 1,
      }),
      true,
    );
  });

  it("does not treat default campaign level 1 with 0 xp as established", () => {
    assert.equal(
      isEduDecaStudentEstablished({
        classLevel: null,
        institutionName: "",
        disciplines: [],
        xp: 0,
        campaignLevel: 1,
      }),
      false,
    );
  });
});
