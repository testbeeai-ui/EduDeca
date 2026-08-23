/**
 * Local unit checks for signup class/college helpers (no vitest in package).
 * Run: npx tsx scripts/test-signup-profile.ts
 */
import {
  buildFillIfEmptyEduDecaProfilePatch,
  isSignupClassCollegeReady,
  isSignupProfileReady,
  shouldWriteEduDecaEmail,
} from "../lib/signin/signup-profile";

type Case = { name: string; pass: boolean; detail?: string };

const cases: Case[] = [];

function check(name: string, pass: boolean, detail?: string) {
  cases.push({ name, pass, detail });
}

const readyForm = {
  classLevel: 11 as const,
  college: "KV Indiranagar",
  institutionAck: true,
  state: "Punjab",
  city: "Ludhiana",
};

check("class-college ready: 11 + college", isSignupClassCollegeReady(11, "KV Indiranagar") === true);
check("class-college ready: 12 + college", isSignupClassCollegeReady(12, "DPS RKP") === true);
check("class-college not ready: null class", isSignupClassCollegeReady(null, "KV Indiranagar") === false);
check("class-college not ready: empty college", isSignupClassCollegeReady(11, "") === false);
check("class-college not ready: short college", isSignupClassCollegeReady(11, "A") === false);
check("class-college not ready: whitespace college", isSignupClassCollegeReady(12, "  ") === false);
check("class-college ready: trims college length", isSignupClassCollegeReady(11, "  AB  ") === true);

check("form ready: all fields", isSignupProfileReady(readyForm) === true);
check(
  "form not ready: missing ack",
  isSignupProfileReady({ ...readyForm, institutionAck: false }) === false,
);
check(
  "form not ready: missing state",
  isSignupProfileReady({ ...readyForm, state: "" }) === false,
);
check(
  "form not ready: missing city",
  isSignupProfileReady({ ...readyForm, city: "  " }) === false,
);

check(
  "patch: both empty → both set",
  (() => {
    const patch = buildFillIfEmptyEduDecaProfilePatch(
      { classLevel: 11, college: "Ryan International", state: "Punjab", city: "Ludhiana" },
      { class_level: null, institution_name: null, state: null, city: null },
    );
    return (
      patch?.class_level === 11 &&
      patch.institution_name === "Ryan International" &&
      patch.state === "Punjab" &&
      patch.city === "Ludhiana"
    );
  })(),
);

check(
  "patch: class set → only college",
  (() => {
    const patch = buildFillIfEmptyEduDecaProfilePatch(
      { classLevel: 12, college: "New College", state: "", city: "" },
      { class_level: 11, institution_name: null, state: "Punjab", city: "Ludhiana" },
    );
    return (
      patch !== null &&
      patch.class_level === undefined &&
      patch.institution_name === "New College" &&
      patch.state === undefined &&
      patch.city === undefined
    );
  })(),
);

check(
  "patch: college set → only class",
  (() => {
    const patch = buildFillIfEmptyEduDecaProfilePatch(
      { classLevel: 12, college: "Ignored", state: "", city: "" },
      { class_level: null, institution_name: "Existing School", state: null, city: null },
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
  buildFillIfEmptyEduDecaProfilePatch(
    { classLevel: 12, college: "Should Not Write", state: "Delhi", city: "New Delhi" },
    { class_level: 11, institution_name: "Existing", state: "Punjab", city: "Ludhiana" },
  ) === null,
);

check(
  "patch: blank institution treated as empty",
  (() => {
    const patch = buildFillIfEmptyEduDecaProfilePatch(
      { classLevel: 11, college: "Filled", state: "", city: "" },
      { class_level: 12, institution_name: "   ", state: "Punjab", city: "Ludhiana" },
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
  buildFillIfEmptyEduDecaProfilePatch(
    { classLevel: 11, college: "  Trim Me  ", state: "  Punjab  ", city: "  Ludhiana  " },
    { class_level: null, institution_name: null, state: null, city: null },
  )?.institution_name === "Trim Me",
);

check(
  "patch: location empty on profile → fill",
  (() => {
    const patch = buildFillIfEmptyEduDecaProfilePatch(
      { classLevel: 11, college: "KV", state: "Punjab", city: "Ludhiana" },
      { class_level: 11, institution_name: "KV", state: null, city: "  " },
    );
    return patch?.state === "Punjab" && patch.city === "Ludhiana";
  })(),
);

check("email write when blank", shouldWriteEduDecaEmail(null) === true);
check("email write when whitespace", shouldWriteEduDecaEmail("  ") === true);
check("email skip when set", shouldWriteEduDecaEmail("mailidpwd@gmail.com") === false);

const failed = cases.filter((c) => !c.pass);
for (const c of cases) {
  console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
}
if (failed.length) {
  console.error(`\n${failed.length}/${cases.length} failed`);
  process.exit(1);
}
console.log(`\n${cases.length}/${cases.length} passed`);
