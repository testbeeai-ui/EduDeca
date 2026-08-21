/**
 * Student track labels for the college dashboard.
 * Run: npx tsx scripts/test-student-track.ts
 */
import {
  collegeStreamsOfferedLabel,
  studentTrackFromDisciplines,
} from "../lib/college/student-track";

let failed = 0;

function check(label: string, ok: boolean) {
  if (ok) {
    console.log(`ok  ${label}`);
  } else {
    failed += 1;
    console.error(`FAIL ${label}`);
  }
}

const pcmLineup = ["phy", "che", "mat", "amat", "ent", "eng", "eco", "log", "gk", "fin"];
const pcbLineup = ["phy", "che", "bio", "biotech", "ent", "eng", "eco", "log", "gk", "fin"];

check("Mathematics lineup → PCM", studentTrackFromDisciplines(pcmLineup) === "PCM");
check("Biology lineup → PCB", studentTrackFromDisciplines(pcbLineup) === "PCB");
check("empty → dash", studentTrackFromDisciplines([]) === "—");
check("null → dash", studentTrackFromDisciplines(null) === "—");
check(
  "never invent PCM+B for a student",
  studentTrackFromDisciplines(pcmLineup) !== "PCM+B" &&
    studentTrackFromDisciplines(pcbLineup) !== "PCM+B",
);
check(
  "college offering both streams is PCM + PCB",
  collegeStreamsOfferedLabel(true, true) === "PCM + PCB",
);
check("college math only → PCM", collegeStreamsOfferedLabel(true, false) === "PCM");
check("college bio only → PCB", collegeStreamsOfferedLabel(false, true) === "PCB");

if (failed > 0) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nall passed");
