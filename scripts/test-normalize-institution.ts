/**
 * Local unit checks for college institution name matching.
 * Run: npx tsx scripts/test-normalize-institution.ts
 */
import {
  institutionsMatch,
  normalizeInstitutionName,
} from "../lib/college/normalize-institution";

let failed = 0;

function check(label: string, ok: boolean) {
  if (ok) {
    console.log(`ok  ${label}`);
  } else {
    failed += 1;
    console.error(`FAIL ${label}`);
  }
}

check("normalize trims+lower", normalizeInstitutionName("  Viswa Vignan  ") === "viswa vignan");
check(
  "normalize punctuation",
  normalizeInstitutionName("St. Mary's Jr. College!") === "st mary s jr college",
);
check(
  "match equal",
  institutionsMatch("Viswa Vignan Junior College", "viswa vignan junior college") === true,
);
check(
  "match unequal",
  institutionsMatch("Viswa Vignan", "DPS RKP") === false,
);
check("match empty", institutionsMatch("", "X") === false);

if (failed > 0) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nall passed");
