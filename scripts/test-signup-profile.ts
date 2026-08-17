/**
 * Local unit checks for signup class/college helpers (no vitest in package).
 * Run: npx tsx scripts/test-signup-profile.ts
 */
import {
  buildFillIfEmptyProfilePatch,
  isSignupProfileReady,
} from "../lib/signin/signup-profile";

type Case = { name: string; pass: boolean; detail?: string };

const cases: Case[] = [];

function check(name: string, pass: boolean, detail?: string) {
  cases.push({ name, pass, detail });
}

check("ready: class 11 + college", isSignupProfileReady(11, "KV Indiranagar") === true);
check("ready: class 12 + college", isSignupProfileReady(12, "DPS RKP") === true);
check("not ready: null class", isSignupProfileReady(null, "KV Indiranagar") === false);
check("not ready: empty college", isSignupProfileReady(11, "") === false);
check("not ready: short college", isSignupProfileReady(11, "A") === false);
check("not ready: whitespace college", isSignupProfileReady(12, "  ") === false);
check("ready: trims college length", isSignupProfileReady(11, "  AB  ") === true);

check(
  "patch: both empty → both set",
  (() => {
    const patch = buildFillIfEmptyProfilePatch(
      { classLevel: 11, college: "Ryan International" },
      { class_level: null, institution_name: null },
    );
    return (
      patch?.class_level === 11 && patch.institution_name === "Ryan International"
    );
  })(),
);

check(
  "patch: class set → only college",
  (() => {
    const patch = buildFillIfEmptyProfilePatch(
      { classLevel: 12, college: "New College" },
      { class_level: 11, institution_name: null },
    );
    return (
      patch !== null &&
      patch.class_level === undefined &&
      patch.institution_name === "New College"
    );
  })(),
);

check(
  "patch: college set → only class",
  (() => {
    const patch = buildFillIfEmptyProfilePatch(
      { classLevel: 12, college: "Ignored" },
      { class_level: null, institution_name: "Existing School" },
    );
    return (
      patch !== null &&
      patch.class_level === 12 &&
      patch.institution_name === undefined
    );
  })(),
);

check(
  "patch: both set → null (no overwrite)",
  buildFillIfEmptyProfilePatch(
    { classLevel: 12, college: "Should Not Write" },
    { class_level: 11, institution_name: "Existing" },
  ) === null,
);

check(
  "patch: blank institution treated as empty",
  (() => {
    const patch = buildFillIfEmptyProfilePatch(
      { classLevel: 11, college: "Filled" },
      { class_level: 12, institution_name: "   " },
    );
    return (
      patch !== null &&
      patch.class_level === undefined &&
      patch.institution_name === "Filled"
    );
  })(),
);

check(
  "patch: trims college on write",
  buildFillIfEmptyProfilePatch(
    { classLevel: 11, college: "  Trim Me  " },
    { class_level: null, institution_name: null },
  )?.institution_name === "Trim Me",
);

const failed = cases.filter((c) => !c.pass);
for (const c of cases) {
  console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
}
if (failed.length) {
  console.error(`\n${failed.length}/${cases.length} failed`);
  process.exit(1);
}
console.log(`\n${cases.length}/${cases.length} passed`);
