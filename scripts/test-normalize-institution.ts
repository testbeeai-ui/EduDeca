/**
 * Local unit checks for college institution name + location matching.
 * Run: npx tsx scripts/test-normalize-institution.ts
 */
import {
  collegeJoinMatch,
  institutionsMatch,
  locationsMatch,
  normalizeInstitutionName,
  normalizeLocationPart,
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

check("location normalize", normalizeLocationPart("  Bengaluru  ") === "bengaluru");
check(
  "locations match same city",
  locationsMatch("Karnataka", "Bengaluru", "karnataka", "bengaluru") === true,
);
check(
  "locations reject different city",
  locationsMatch("Karnataka", "Bengaluru", "Karnataka", "Mysuru") === false,
);
check(
  "locations reject empty",
  locationsMatch("Karnataka", "", "Karnataka", "Bengaluru") === false,
);

check(
  "join requires name and location",
  collegeJoinMatch(
    { institutionName: "Viswa Vignan", state: "Telangana", city: "Hyderabad" },
    { institutionName: "viswa vignan", state: "Telangana", city: "Hyderabad" },
  ) === true,
);
check(
  "join rejects same name different city",
  collegeJoinMatch(
    { institutionName: "Viswa Vignan", state: "Telangana", city: "Hyderabad" },
    { institutionName: "Viswa Vignan", state: "Telangana", city: "Warangal" },
  ) === false,
);
check(
  "join rejects different name same city",
  collegeJoinMatch(
    { institutionName: "Viswa Vignan", state: "Telangana", city: "Hyderabad" },
    { institutionName: "DPS RKP", state: "Telangana", city: "Hyderabad" },
  ) === false,
);

if (failed > 0) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nall passed");
