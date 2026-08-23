import assert from "node:assert/strict";
import test from "node:test";

import { buildStudentWelcomeEmail } from "./studentWelcomeEmailTemplate";

test("buildStudentWelcomeEmail includes design copy and branding", () => {
  const { subject, html, text } = buildStudentWelcomeEmail({
    email: "adwait.kamble23@pccoepune.org",
    displayName: "Adwait",
    ctaUrl: "https://edu-deca.vercel.app",
  });

  assert.equal(subject, "Welcome to EduDeca, Adwait");
  assert.match(html, /Welcome aboard, Adwait/);
  assert.match(html, /https:\/\/www\.edublast\.in\/images\/logo-2\.png/);
  assert.match(html, /alt="EduBlast"/);
  assert.match(html, /Continue to EduDeca/);
  assert.match(html, /www\.edudeca\.com/);
  assert.match(html, /admin@edudeca\.com/);
  assert.match(html, /Levels 1–2/);
  assert.match(html, /WHAT'S NEXT/);
  assert.match(html, /www\.edubite\.com/);
  assert.doesNotMatch(html, /QR/);
  assert.doesNotMatch(html, /Google Play/);
  assert.doesNotMatch(html, /data:image/);
  assert.match(text, /admin@edudeca\.com/);
  assert.match(text, /edudeca\.com/);
});

test("buildStudentWelcomeEmail escapes display name html", () => {
  const { html } = buildStudentWelcomeEmail({
    email: "a@b.com",
    displayName: `<script>alert(1)</script>`,
    ctaUrl: "https://example.com",
  });
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});

test("buildStudentWelcomeEmail derives name from email local part", () => {
  const { subject, html } = buildStudentWelcomeEmail({
    email: "priya.sharma@college.edu",
    ctaUrl: "https://example.com/cta",
  });
  assert.match(subject, /Priya/);
  assert.match(html, /Welcome aboard, Priya/);
});
