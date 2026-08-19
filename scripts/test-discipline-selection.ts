/**
 * Local unit checks for Decathlon lineup selection (no vitest in package).
 * Run: npx tsx scripts/test-discipline-selection.ts
 */
import {
  emptyLineup,
  filledCount,
  isLineupComplete,
  lineupIds,
  lockEntrepreneurshipSlot,
  selectTrackOption,
  TRACK_A_SLOT,
  TRACK_B_SLOT,
  ENTREPRENEURSHIP_SLOT,
  validateLineup,
} from "../lib/disciplines/selection";

type Case = { name: string; pass: boolean };

const cases: Case[] = [];

function check(name: string, pass: boolean) {
  cases.push({ name, pass });
}

const fresh = emptyLineup();
check("empty lineup locks Entrepreneurship in slot 5", fresh[ENTREPRENEURSHIP_SLOT] === "ent");
check("empty lineup has 8 locked cores", filledCount(fresh) === 8);
check("empty lineup is not complete until Track A", isLineupComplete(fresh) === false);
check("empty lineup leaves Track A empty", fresh[TRACK_A_SLOT] === null);
check("empty lineup leaves Track B empty", fresh[TRACK_B_SLOT] === null);

const withCs = { ...fresh, [ENTREPRENEURSHIP_SLOT]: "cs" as const };
const locked = lockEntrepreneurshipSlot(withCs);
check("lockEntrepreneurshipSlot overwrites CS with ent", locked[ENTREPRENEURSHIP_SLOT] === "ent");
check("lockEntrepreneurshipSlot is a no-op when already ent", lockEntrepreneurshipSlot(fresh) === fresh);

const math = selectTrackOption(fresh, "A", "mat");
check("Track A Mathematics fills slot 3", math[TRACK_A_SLOT] === "mat");
check("Track A Mathematics auto-fills Applied Maths", math[TRACK_B_SLOT] === "amat");
check("Track A Mathematics keeps Entrepreneurship locked", math[ENTREPRENEURSHIP_SLOT] === "ent");
check("Track A Mathematics completes the 10-discipline lineup", isLineupComplete(math) === true);

const bio = selectTrackOption(fresh, "A", "bio");
check("Track A Biology fills slot 3", bio[TRACK_A_SLOT] === "bio");
check("Track A Biology auto-fills Biotechnology", bio[TRACK_B_SLOT] === "biotech");
check("Track A Biology completes the 10-discipline lineup", isLineupComplete(bio) === true);

const cleared = selectTrackOption(math, "A", "mat");
check("clicking Track A again clears both family slots", cleared[TRACK_A_SLOT] === null && cleared[TRACK_B_SLOT] === null);
check("unchecking Track A keeps Entrepreneurship locked", cleared[ENTREPRENEURSHIP_SLOT] === "ent");
check(
  "Track C cannot unset Entrepreneurship",
  selectTrackOption(withCs, "C", "cs")[ENTREPRENEURSHIP_SLOT] === "ent",
);

const stored = lineupIds(math);
check(
  "lineupIds keeps backend slot order (Track A at index 2)",
  stored[0] === "phy" && stored[2] === "mat" && stored[4] === "ent" && stored[5] === "eng",
);

const fromCs = validateLineup(["phy", "che", "mat", "amat", "cs", "eng", "eco", "log", "gk", "fin"]);
check("validateLineup rewrites stored CS to Entrepreneurship", fromCs?.[5] === "ent");
check("validateLineup keeps a complete 10 after CS rewrite", fromCs !== null && isLineupComplete(fromCs));

check(
  "validateLineup rejects mixed math/bio tracks",
  validateLineup(["phy", "che", "mat", "biotech", "ent", "eng", "eco", "log", "gk", "fin"]) === null,
);
check(
  "validateLineup accepts linked biology pair",
  validateLineup(["phy", "che", "bio", "biotech", "ent", "eng", "eco", "log", "gk", "fin"]) != null,
);
check(
  "validateLineup rejects duplicate ids",
  validateLineup(["phy", "che", "mat", "mat", "ent", "eng", "eco", "log", "gk", "fin"]) === null,
);

const failed = cases.filter((c) => !c.pass);
for (const c of cases) {
  console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.name}`);
}
if (failed.length) {
  console.error(`\n${failed.length}/${cases.length} failed`);
  process.exit(1);
}
console.log(`\n${cases.length}/${cases.length} passed`);
