/**
 * Local checks for draft → DB field mapping used by college registry.
 * Run: npx tsx scripts/test-college-registry-fields.ts
 */
import { draftToApplicationFields } from "../lib/college/registry-store";
import { emptyCollegeRegistrationDraft } from "../lib/college/registration";

let failed = 0;
function check(label: string, ok: boolean) {
  if (ok) console.log(`ok  ${label}`);
  else {
    failed += 1;
    console.error(`FAIL ${label}`);
  }
}

const draft = {
  ...emptyCollegeRegistrationDraft(),
  institutionName: "  Viswa Vignan  ",
  state: "Andhra Pradesh",
  city: "Vijayawada",
  xiCount: "180",
  xiiCount: "90",
  math: true,
  bio: false,
  principalName: "P",
  principalMobile: "1",
  principalEmail: "a@b.c",
  contactName: "C",
  contactMobile: "2",
  contactEmail: "c@d.e",
  pledge: true,
  xiFileName: "xi.xlsx",
};

const fields = draftToApplicationFields(draft);
check("trims name", fields.institutionName === "Viswa Vignan");
check("institution key", fields.institutionKey === "viswa vignan");
check("keeps counts", fields.xiCount === "180" && fields.xiiCount === "90");
check("file name", fields.xiFileName === "xi.xlsx");

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nall passed");
