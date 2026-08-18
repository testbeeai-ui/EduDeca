/**
 * Layout contract for the sign-in walkthrough shell.
 * Run: npx tsx scripts/test-auth-page-layout.ts
 */
import {
  AUTH_PAGE_CENTER_CLASS,
  AUTH_PAGE_SCROLL_CLASS,
  isUnsafeCenteredOverflowFlex,
} from "../lib/shell/auth-page-layout";

type Case = { name: string; pass: boolean };

const cases: Case[] = [];

function check(name: string, pass: boolean) {
  cases.push({ name, pass });
}

check(
  "known-bad combo: overflow-y-auto + items-center is unsafe",
  isUnsafeCenteredOverflowFlex(
    "flex min-h-0 flex-1 items-start justify-center overflow-y-auto sm:items-center",
  ) === true,
);

check(
  "auth scroll region can scroll",
  AUTH_PAGE_SCROLL_CLASS.includes("overflow-y-auto"),
);

check(
  "auth scroll region is not a centered overflow flex",
  isUnsafeCenteredOverflowFlex(AUTH_PAGE_SCROLL_CLASS) === false,
);

check(
  "centering uses min-h-full inner wrapper",
  AUTH_PAGE_CENTER_CLASS.includes("min-h-full") &&
    AUTH_PAGE_CENTER_CLASS.includes("items-center"),
);

check(
  "centering is not on the scroll region",
  !AUTH_PAGE_SCROLL_CLASS.includes("items-center"),
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
