/**
 * Local unit checks for Decathlon lineup selection (no vitest in package).
 * Run: npx tsx scripts/test-discipline-selection.ts
 */
import {
  emptyLineup,
  filledCount,
  isLineupComplete,
  lockEntrepreneurshipSlot,
  selectTrackOption,
} from "../lib/disciplines/selection";

type Case = { name: string; pass: boolean };

const cases: Case[] = [];

function check(name: string, pass: boolean) {
  cases.push({ name, pass });
}

const fresh = emptyLineup();
check("empty lineup locks Entrepreneurship in slot 5", fresh[5] === "ent");
check("empty lineup has 8 locked cores", filledCount(fresh) === 8);
check("empty lineup is not complete until Track A", isLineupComplete(fresh) === false);
check("empty lineup leaves Track A empty", fresh[3] === null);
check("empty lineup leaves Track B empty", fresh[4] === null);

const withCs = { ...fresh, 5: "cs" as const };
const locked = lockEntrepreneurshipSlot(withCs);
check("lockEntrepreneurshipSlot overwrites CS with ent", locked[5] === "ent");
check("lockEntrepreneurshipSlot is a no-op when already ent", lockEntrepreneurshipSlot(fresh) === fresh);

const math = selectTrackOption(fresh, "A", "mat");
check("Track A Mathematics fills slot 3", math[3] === "mat");
check("Track A Mathematics auto-fills Applied Maths", math[4] === "amat");
check("Track A Mathematics keeps Entrepreneurship locked", math[5] === "ent");
check("Track A Mathematics completes the 10-discipline lineup", isLineupComplete(math) === true);

const bio = selectTrackOption(fresh, "A", "bio");
check("Track A Biology fills slot 3", bio[3] === "bio");
check("Track A Biology auto-fills Biotechnology", bio[4] === "biotech");
check("Track A Biology completes the 10-discipline lineup", isLineupComplete(bio) === true);

const cleared = selectTrackOption(math, "A", "mat");
check("clicking Track A again clears both family slots", cleared[3] === null && cleared[4] === null);
check("unchecking Track A keeps Entrepreneurship locked", cleared[5] === "ent");

const failed = cases.filter((c) => !c.pass);
for (const c of cases) {
  console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.name}`);
}
if (failed.length) {
  console.error(`\n${failed.length}/${cases.length} failed`);
  process.exit(1);
}
console.log(`\n${cases.length}/${cases.length} passed`);
