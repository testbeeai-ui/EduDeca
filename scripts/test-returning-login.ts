/**
 * Local checks for returning-login established detection.
 * Run: npx tsx scripts/test-returning-login.ts
 */
import { isEduDecaStudentEstablished } from "../lib/signin/returning-login";

let failed = 0;
function check(label: string, ok: boolean) {
  if (ok) console.log(`ok  ${label}`);
  else {
    failed += 1;
    console.error(`FAIL ${label}`);
  }
}

check(
  "empty is not established",
  isEduDecaStudentEstablished({
    classLevel: null,
    institutionName: null,
    disciplines: null,
  }) === false,
);

check(
  "class+college established",
  isEduDecaStudentEstablished({
    classLevel: 11,
    institutionName: "KV Indiranagar",
    disciplines: null,
  }) === true,
);

check(
  "full lineup established",
  isEduDecaStudentEstablished({
    classLevel: null,
    institutionName: "",
    disciplines: Array.from({ length: 10 }, (_, i) => `d${i}`),
  }) === true,
);

check(
  "xp established",
  isEduDecaStudentEstablished({
    classLevel: null,
    institutionName: null,
    disciplines: [],
    xp: 50,
  }) === true,
);

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nall passed");
