"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import styles from "@/components/college/college-registration.module.css";
import { readCollegeRegistrationDraft } from "@/lib/college/registration";
import { submitCollegeApplicationWithUploads } from "@/lib/college/submit-application";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

export function CollegePendingView() {
  const router = useRouter();
  const signOut = useAppStore((s) => s.signOut);
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  const hasHydrated = useAppStore((s) => s.hasHydrated);
  const [status, setStatus] = useState<"submitting" | "pending" | "approved" | "error">(
    "submitting",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isSignedIn) {
      router.replace("/college/signin");
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const draft = readCollegeRegistrationDraft();
        if (draft?.institutionName.trim()) {
          const result = await submitCollegeApplicationWithUploads(draft);
          if (!result.ok) {
            if (!cancelled) {
              setStatus("error");
              setError(result.error);
            }
            return;
          }
        }

        const mine = await fetch("/api/college/applications", { credentials: "include" });
        const json = (await mine.json()) as {
          application?: { status?: string } | null;
        };

        const appStatus =
          json.application && typeof json.application.status === "string"
            ? json.application.status
            : null;

        if (cancelled) return;

        if (appStatus === "approved") {
          setStatus("approved");
          router.replace("/college/portal");
          return;
        }

        if (!draft?.institutionName.trim() && !appStatus) {
          setStatus("error");
          setError("No registration draft found. Please complete college sign-up again.");
          return;
        }

        setStatus("pending");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setError("Could not save your college application.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, isSignedIn, router]);

  const handleSignOut = async () => {
    signOut();
    await supabase.auth.signOut({ scope: "local" });
    window.location.href = "/college/signin";
  };

  return (
    <div className={styles.root}>
      <div className={styles.pendingCard}>
        <span className={styles.pendingBadge}>
          {status === "approved" ? "VERIFIED" : "APPLICATION RECEIVED"}
        </span>
        <h1 className={styles.pendingTitle}>
          {status === "submitting"
            ? "Submitting your application…"
            : status === "approved"
              ? "College verified"
              : "Thank you for registering"}
        </h1>
        <p className={styles.pendingBody}>
          {status === "error"
            ? error
            : status === "approved"
              ? "Redirecting you to the college portal…"
              : "Our team will verify your college registration. Thank you for your time — we will be in touch once your institution is approved. You will not have dashboard access until verification is complete."}
        </p>
        {status === "pending" || status === "error" ? (
          <p className={styles.privacyNote}>
            This Google account is tied to a <b style={{ color: "var(--cr-text)" }}>college</b>{" "}
            registration. Use a different Google account to sign in as a student.
          </p>
        ) : null}
        {status !== "submitting" && status !== "approved" ? (
          <button type="button" className={styles.googleBtn} onClick={() => void handleSignOut()}>
            Sign out
          </button>
        ) : null}
        <Link href="/signin" className={styles.studentLink}>
          Back to student sign-in →
        </Link>
      </div>
    </div>
  );
}
