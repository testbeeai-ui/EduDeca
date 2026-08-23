/**
 * Local checks for college upload metadata helpers.
 * Run: npx tsx scripts/test-college-upload-meta.ts
 */
import {
  collegeUploadExtension,
  isAllowedCollegeUploadName,
  isAllowedCollegeUploadSize,
  isCollegeUploadKind,
  sanitizeCollegeUploadBaseName,
  COLLEGE_UPLOAD_MAX_BYTES,
} from "../lib/college/upload-meta";

let failed = 0;
function check(label: string, ok: boolean) {
  if (ok) console.log(`ok  ${label}`);
  else {
    failed += 1;
    console.error(`FAIL ${label}`);
  }
}

check("xlsx ok", isAllowedCollegeUploadName("students.xlsx") === true);
check("csv ok", isAllowedCollegeUploadName("list.CSV") === true);
check("pdf blocked", isAllowedCollegeUploadName("x.pdf") === false);
check("ext parse", collegeUploadExtension("a/b/c.XLSX") === "xlsx");
check("size ok", isAllowedCollegeUploadSize(100) === true);
check("size zero", isAllowedCollegeUploadSize(0) === false);
check("size too big", isAllowedCollegeUploadSize(COLLEGE_UPLOAD_MAX_BYTES + 1) === false);
check("sanitize traversal", !sanitizeCollegeUploadBaseName("../evil.xlsx").includes(".."));
check("kind xi", isCollegeUploadKind("xi") === true);
check("kind bad", isCollegeUploadKind("xiii") === false);

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nall passed");
