/**
 * Local unit checks for EduDeca referral helpers (no vitest in package).
 * Run: npx tsx scripts/test-referral-scenarios.ts
 */
import {
  buildEduDecaShareUrl,
  displayReferrerName,
  initialsFromName,
  normalizeEduDecaReferralCode,
} from "../lib/referral/referral-code";

type Case = { name: string; pass: boolean; detail?: string };

const cases: Case[] = [];

function check(name: string, pass: boolean, detail?: string) {
  cases.push({ name, pass, detail });
}

// Valid ED codes
check(
  "accepts canonical ED code",
  normalizeEduDecaReferralCode("ED-267K2M9Q4A") === "ED-267K2M9Q4A",
);
check(
  "uppercases lowercase ED code",
  normalizeEduDecaReferralCode("ed-267k2m9q4a") === "ED-267K2M9Q4A",
);
check(
  "trims whitespace",
  normalizeEduDecaReferralCode("  ED-267K2M9Q4A  ") === "ED-267K2M9Q4A",
);

// Reject Student ID / bad shapes
check(
  "rejects EB student id",
  normalizeEduDecaReferralCode("EB-26K7M2Q9") === null,
);
check(
  "rejects letter-first after year (EB pattern on ED prefix)",
  normalizeEduDecaReferralCode("ED-26K7M2Q9AB") === null,
);
check(
  "rejects short code",
  normalizeEduDecaReferralCode("ED-267K2M") === null,
);
check(
  "rejects hex7 EduBlast style",
  normalizeEduDecaReferralCode("A1B2C3D") === null,
);
check("rejects empty", normalizeEduDecaReferralCode("") === null);
check("rejects null", normalizeEduDecaReferralCode(null) === null);

// Share URL
check(
  "share URL encodes ref",
  buildEduDecaShareUrl("http://localhost:3001", "ED-267K2M9Q4A") ===
    "http://localhost:3001/join?ref=ED-267K2M9Q4A",
);
check(
  "invalid code falls back to /join",
  buildEduDecaShareUrl("http://localhost:3001", "EB-26K7M2Q9") ===
    "http://localhost:3001/join",
);

// Display name for join copy
check(
  "display keeps full profile name",
  displayReferrerName("Priya Sharma") === "Priya Sharma",
);
check("display empty becomes a friend", displayReferrerName("  ") === "a friend");
check(
  "display email uses local token",
  displayReferrerName("priya.sharma@gmail.com") === "Priya",
);

// Initials
check("initials two words", initialsFromName("Ishita Rao") === "IR");
check("initials one word", initialsFromName("Aarav") === "A");
check("initials empty", initialsFromName("   ") === "?");

const failed = cases.filter((c) => !c.pass);
for (const c of cases) {
  console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
}
console.log(`\n${cases.length - failed.length}/${cases.length} passed`);
if (failed.length) process.exit(1);
