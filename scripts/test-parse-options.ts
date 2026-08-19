/**
 * Local unit checks for challenge option parsing (no vitest in package).
 * Run: npx tsx scripts/test-parse-options.ts
 */
import { parseQuestionOptions } from "../lib/challenge/parse-options";

type Case = { name: string; pass: boolean };

const cases: Case[] = [];

function check(name: string, pass: boolean) {
  cases.push({ name, pass });
}

check("array options stay strings", parseQuestionOptions(["A", 1]).join("|") === "A|1");
check("json string parses", parseQuestionOptions('["x","y"]').join("|") === "x|y");
check("invalid json does not throw", parseQuestionOptions("{not json").length === 0);
check("non-array json is empty", parseQuestionOptions('{"a":1}').length === 0);
check("empty input is empty", parseQuestionOptions(null).length === 0);

const failed = cases.filter((c) => !c.pass);
for (const c of cases) {
  console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.name}`);
}
if (failed.length) {
  console.error(`\n${failed.length}/${cases.length} failed`);
  process.exit(1);
}
console.log(`\n${cases.length}/${cases.length} passed`);
