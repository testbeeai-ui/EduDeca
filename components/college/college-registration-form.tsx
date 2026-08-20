"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import styles from "@/components/college/college-registration.module.css";
import {
  AUTH_NEXT_COOKIE,
  emptyCollegeRegistrationDraft,
  isCollegeRegistrationReady,
  readCollegeRegistrationDraft,
  writeCollegeRegistrationDraft,
  type CollegeRegistrationDraft,
} from "@/lib/college/registration";
import { getCitiesForState, INDIAN_STATES_AND_UTS } from "@/lib/signin/india-geo";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function SectionNum({
  n,
  tone,
}: {
  n: number;
  tone: "teal" | "blue" | "purple" | "amber" | "red";
}) {
  const toneStyle: Record<typeof tone, { background: string; color: string }> = {
    teal: { background: "rgba(34,211,166,.12)", color: "#22D3A6" },
    blue: { background: "rgba(79,163,232,.12)", color: "#4FA3E8" },
    purple: { background: "rgba(154,140,242,.12)", color: "#9A8CF2" },
    amber: { background: "rgba(242,180,65,.12)", color: "#F2B441" },
    red: { background: "rgba(240,101,79,.12)", color: "#F0654F" },
  };
  return (
    <div className={styles.sectionNum} style={toneStyle[tone]}>
      {n}
    </div>
  );
}

export function CollegeRegistrationForm() {
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState<CollegeRegistrationDraft>(emptyCollegeRegistrationDraft);
  const [hydrated, setHydrated] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [showReqNote, setShowReqNote] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    const authError = searchParams.get("auth_error");
    if (authError === "oauth_exchange_failed") {
      return "Google sign-in did not finish. Add http://localhost:3001/auth/callback in Supabase → Authentication → Redirect URLs, then use http://localhost:3001 (not 127.0.0.1).";
    }
    return null;
  });

  useEffect(() => {
    const saved = readCollegeRegistrationDraft();
    if (saved) setDraft(saved);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeCollegeRegistrationDraft(draft);
  }, [draft, hydrated]);

  const cities = getCitiesForState(draft.state);
  const ready = isCollegeRegistrationReady(draft);
  const canStartGoogle = ready && !signingIn;

  const patch = (partial: Partial<CollegeRegistrationDraft>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
    setError(null);
    setShowReqNote(false);
  };

  const handleGoogleSignIn = async () => {
    if (!isCollegeRegistrationReady(draft)) {
      setShowReqNote(true);
      return;
    }

    setSigningIn(true);
    setError(null);
    writeCollegeRegistrationDraft(draft);

    try {
      const origin = window.location.origin;
      if (origin.includes("127.0.0.1") || /^https?:\/\/\d+\.\d+\.\d+\.\d+/.test(origin)) {
        setError("Open EduDeca at http://localhost:3001 before signing in.");
        setSigningIn(false);
        return;
      }

      // Already signed in (e.g. student account) — submit application and go to pending.
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        const res = await fetch("/api/college/applications", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draft }),
        });
        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as { error?: string };
          setError(json.error || "Could not submit college application.");
          setSigningIn(false);
          return;
        }
        window.location.href = "/college/pending";
        return;
      }

      document.cookie = `${AUTH_NEXT_COOKIE}=${encodeURIComponent("/college/pending")}; path=/; max-age=600; SameSite=Lax`;

      const redirectTo = `${origin}/auth/callback`;
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account" },
        },
      });

      if (oauthError) {
        console.error("college signInWithOAuth error:", oauthError);
        setError(oauthError.message || "Could not start Google sign-in. Please try again.");
        setSigningIn(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setError("Could not start Google sign-in. Please try again.");
      setSigningIn(false);
    } catch (err) {
      console.error("college signInWithOAuth error:", err);
      setError("Could not start Google sign-in. Please try again.");
      setSigningIn(false);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.stepCount}>College sign-up</div>

        <div className={styles.finalBadgeWrap}>
          <span className={styles.finalBadge}>🏫 REGISTER YOUR COLLEGE</span>
        </div>

        <h1 className={styles.title}>Bring EduDeca to Your Campus</h1>
        <p className={styles.subtext}>
          Register once to unlock proctored Level 4–10 rounds, college leaderboards, and national
          finals for your students.
        </p>

        {/* 1. Institution details */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <SectionNum n={1} tone="teal" />
            <div>
              <div className={styles.sectionTitle}>Institution Details</div>
              <div className={styles.sectionSub}>Basic information about your college or school</div>
            </div>
          </div>

          <div className={styles.field}>
            <div className={styles.fieldLabel}>Institution Name</div>
            <input
              className={styles.input}
              type="text"
              value={draft.institutionName}
              placeholder="e.g. Viswa Vignan Junior College"
              onChange={(e) => patch({ institutionName: e.target.value })}
            />
          </div>

          <div className={styles.field}>
            <div className={styles.fieldLabel}>Location (within India)</div>
            <div className={styles.grid2}>
              <select
                className={styles.select}
                value={draft.state}
                onChange={(e) => patch({ state: e.target.value, city: "" })}
              >
                <option value="">Select State</option>
                {INDIAN_STATES_AND_UTS.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              <select
                className={styles.select}
                value={draft.city}
                disabled={!draft.state}
                onChange={(e) => patch({ city: e.target.value })}
              >
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 2. Student strength */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <SectionNum n={2} tone="blue" />
            <div>
              <div className={styles.sectionTitle}>Student Strength</div>
              <div className={styles.sectionSub}>
                Approximate numbers help us plan proctoring capacity
              </div>
            </div>
          </div>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Number of Class XI students</div>
              <input
                className={styles.input}
                type="number"
                min={0}
                value={draft.xiCount}
                placeholder="e.g. 120"
                onChange={(e) => patch({ xiCount: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Number of Class XII students</div>
              <input
                className={styles.input}
                type="number"
                min={0}
                value={draft.xiiCount}
                placeholder="e.g. 110"
                onChange={(e) => patch({ xiiCount: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* 3. Subjects taught */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <SectionNum n={3} tone="purple" />
            <div>
              <div className={styles.sectionTitle}>Subjects Taught</div>
              <div className={styles.sectionSub}>
                Physics &amp; Chemistry are core to every EduDeca track and always included
              </div>
            </div>
          </div>
          <div className={styles.subjectGrid}>
            <div className={cn(styles.subjRow, styles.subjRowChecked, styles.subjRowLocked)}>
              <input type="checkbox" checked disabled readOnly />
              <span className={styles.subjName}>Physics</span>
              <span className={styles.subjTag}>Always on</span>
            </div>
            <div className={cn(styles.subjRow, styles.subjRowChecked, styles.subjRowLocked)}>
              <input type="checkbox" checked disabled readOnly />
              <span className={styles.subjName}>Chemistry</span>
              <span className={styles.subjTag}>Always on</span>
            </div>
            <div
              className={cn(styles.subjRow, draft.math && styles.subjRowChecked)}
              onClick={() => patch({ math: !draft.math })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  patch({ math: !draft.math });
                }
              }}
              role="button"
              tabIndex={0}
            >
              <input
                type="checkbox"
                checked={draft.math}
                onChange={(e) => {
                  e.stopPropagation();
                  patch({ math: e.target.checked });
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <span className={styles.subjName}>Mathematics</span>
            </div>
            <div
              className={cn(styles.subjRow, draft.bio && styles.subjRowChecked)}
              onClick={() => patch({ bio: !draft.bio })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  patch({ bio: !draft.bio });
                }
              }}
              role="button"
              tabIndex={0}
            >
              <input
                type="checkbox"
                checked={draft.bio}
                onChange={(e) => {
                  e.stopPropagation();
                  patch({ bio: e.target.checked });
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <span className={styles.subjName}>Biology</span>
            </div>
          </div>
        </div>

        {/* 4. Principal details */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <SectionNum n={4} tone="amber" />
            <div>
              <div className={styles.sectionTitle}>Principal&apos;s Details</div>
              <div className={styles.sectionSub}>
                Primary authority signing off on this registration
              </div>
            </div>
          </div>
          <div className={styles.field}>
            <div className={styles.fieldLabel}>Principal&apos;s Name</div>
            <input
              className={styles.input}
              type="text"
              value={draft.principalName}
              placeholder="Full name"
              onChange={(e) => patch({ principalName: e.target.value })}
            />
          </div>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Mobile Number</div>
              <input
                className={styles.input}
                type="tel"
                value={draft.principalMobile}
                placeholder="10-digit mobile number"
                onChange={(e) => patch({ principalMobile: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Email Address</div>
              <input
                className={styles.input}
                type="email"
                value={draft.principalEmail}
                placeholder="principal@institution.edu"
                onChange={(e) => patch({ principalEmail: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* 5. Additional contact */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <SectionNum n={5} tone="teal" />
            <div>
              <div className={styles.sectionTitle}>Additional Contact Person</div>
              <div className={styles.sectionSub}>
                A coordinator we can reach for day-to-day logistics
              </div>
            </div>
          </div>
          <div className={styles.field}>
            <div className={styles.fieldLabel}>Contact Person&apos;s Name</div>
            <input
              className={styles.input}
              type="text"
              value={draft.contactName}
              placeholder="Full name"
              onChange={(e) => patch({ contactName: e.target.value })}
            />
          </div>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Mobile Number</div>
              <input
                className={styles.input}
                type="tel"
                value={draft.contactMobile}
                placeholder="10-digit mobile number"
                onChange={(e) => patch({ contactMobile: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Email Address</div>
              <input
                className={styles.input}
                type="email"
                value={draft.contactEmail}
                placeholder="coordinator@institution.edu"
                onChange={(e) => patch({ contactEmail: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* 6. Pledge */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <SectionNum n={6} tone="red" />
            <div>
              <div className={styles.sectionTitle}>Proctoring Pledge</div>
              <div className={styles.sectionSub}>
                Required to unlock Level 4–6 for your students
              </div>
            </div>
          </div>
          <div
            className={cn(styles.checkRow, draft.pledge && styles.checkRowChecked)}
            onClick={() => patch({ pledge: !draft.pledge })}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                patch({ pledge: !draft.pledge });
              }
            }}
            role="button"
            tabIndex={0}
          >
            <input
              type="checkbox"
              id="college-pledge"
              checked={draft.pledge}
              onChange={(e) => {
                e.stopPropagation();
                patch({ pledge: e.target.checked });
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <label htmlFor="college-pledge">
              We shall proctor the student&apos;s competition attempts from Level 4-6 by deputing a
              teacher from our college so that the students cannot use any external aids including AI
              tools. We shall pay or collect from parents the requisite fees (Rs.{" "}
              <span className={styles.pledgeAmt}>999</span>) for him./her to be eligible for Level
              4-6 participation.
            </label>
          </div>
        </div>

        {/* 7. Upload student data */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <SectionNum n={7} tone="blue" />
            <div>
              <div className={styles.sectionTitle}>Upload Student Data</div>
              <div className={styles.sectionSub}>
                CSV or XLSX — name, roll number, and class are enough to start
              </div>
            </div>
          </div>

          <div
            className={cn(styles.uploadRow, draft.xiFileName && styles.uploadRowFilled)}
          >
            <div className={styles.uploadIc}>📄</div>
            <div className={styles.uploadBody}>
              <div className={styles.uploadTitle}>Load Class XI student data</div>
              <div className={styles.uploadSub}>
                {draft.xiFileName
                  ? `${draft.xiFileName} · ready to import`
                  : "No file selected · .csv or .xlsx"}
              </div>
            </div>
            <label className={styles.uploadBtn}>
              Choose file
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  patch({ xiFileName: file.name });
                }}
              />
            </label>
          </div>

          <div
            className={cn(styles.uploadRow, draft.xiiFileName && styles.uploadRowFilled)}
          >
            <div className={styles.uploadIc}>📄</div>
            <div className={styles.uploadBody}>
              <div className={styles.uploadTitle}>Load Class XII student data</div>
              <div className={styles.uploadSub}>
                {draft.xiiFileName
                  ? `${draft.xiiFileName} · ready to import`
                  : "No file selected · .csv or .xlsx"}
              </div>
            </div>
            <label className={styles.uploadBtn}>
              Choose file
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  patch({ xiiFileName: file.name });
                }}
              />
            </label>
          </div>
          <div className={styles.fieldNote}>
            <span>ⓘ</span>
            <span>You can also add students later from the college portal after sign-in.</span>
          </div>
        </div>

        <button
          type="button"
          className={styles.googleBtn}
          disabled={!canStartGoogle}
          onClick={() => void handleGoogleSignIn()}
        >
          <GoogleMark className={styles.gIcon} />
          {signingIn ? "Connecting to Google…" : "Register & Continue with Google"}
        </button>

        {showReqNote ? (
          <div className={styles.reqNote}>
            Please complete all required fields and accept the pledge to continue.
          </div>
        ) : null}

        {error ? <div className={styles.errorBox}>{error}</div> : null}

        <p className={styles.privacyNote}>
          We use Google only to create your college&apos;s EduDeca account — no passwords to
          remember.
        </p>

        <Link href="/signin" className={styles.studentLink}>
          Student sign-in instead →
        </Link>
      </div>
    </div>
  );
}
