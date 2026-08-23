"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import styles from "@/components/college/college-registration.module.css";
import {
  clearCollegeRegistrationDraft,
  readCollegeRegistrationDraft,
} from "@/lib/college/registration";
import { submitCollegeApplicationWithUploads } from "@/lib/college/submit-application";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

type AppStatus = "submitting" | "pending" | "approved" | "rejected" | "error";

export function CollegePendingView() {
  const router = useRouter();
  const signOut = useAppStore((s) => s.signOut);
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  const hasHydrated = useAppStore((s) => s.hasHydrated);
  const [status, setStatus] = useState<AppStatus>("submitting");
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);
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
          application?: {
            status?: string;
            adminFeedback?: string | null;
          } | null;
        };

        const appStatus =
          json.application && typeof json.application.status === "string"
            ? json.application.status
            : null;
        const feedback =
          json.application && typeof json.application.adminFeedback === "string"
            ? json.application.adminFeedback.trim()
            : "";

        if (cancelled) return;

        if (feedback) setAdminFeedback(feedback);
        else setAdminFeedback(null);

        if (appStatus === "approved") {
          setStatus("approved");
          router.replace("/college/portal");
          return;
        }

        if (appStatus === "rejected") {
          setStatus("rejected");
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

  // After admin decides, pick up approval / rejection / new comments without a hard refresh.
  useEffect(() => {
    if (!hasHydrated || !isSignedIn) return;
    if (status !== "pending" && status !== "rejected") return;

    let cancelled = false;
    const tick = async () => {
      try {
        const mine = await fetch("/api/college/applications", { credentials: "include" });
        if (!mine.ok || cancelled) return;
        const json = (await mine.json()) as {
          application?: {
            status?: string;
            adminFeedback?: string | null;
          } | null;
        };
        const next = json.application?.status;
        const feedback =
          typeof json.application?.adminFeedback === "string"
            ? json.application.adminFeedback.trim()
            : "";
        if (feedback) setAdminFeedback(feedback);
        if (next === "approved" && !cancelled) {
          setStatus("approved");
          router.replace("/college/portal");
        } else if (next === "rejected" && !cancelled) {
          setStatus("rejected");
        } else if (next === "pending" && !cancelled) {
          setStatus("pending");
        }
      } catch {
        /* ignore poll errors */
      }
    };

    const id = window.setInterval(() => void tick(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [hasHydrated, isSignedIn, status, router]);

  const handleSignOut = async () => {
    clearCollegeRegistrationDraft();
    signOut();
    await supabase.auth.signOut({ scope: "local" });
    window.location.href = "/home";
  };

  const badge =
    status === "approved"
      ? "VERIFIED"
      : status === "rejected"
        ? "NEEDS CHANGES"
        : "APPLICATION RECEIVED";

  const title =
    status === "submitting"
      ? "Submitting your application…"
      : status === "approved"
        ? "College verified"
        : status === "rejected"
          ? "Application needs attention"
          : "Thank you for registering";

  const body =
    status === "error"
      ? error
      : status === "approved"
        ? "Redirecting you to the college portal…"
        : status === "rejected"
          ? "Our team reviewed your college registration and could not approve it yet. Please read the feedback below, fix the issues, and contact EduDeca or re-submit if asked."
          : "Our team will verify your college registration. Thank you for your time — we will be in touch once your institution is approved. You will not have dashboard access until verification is complete.";

  return (
    <div className={styles.root}>
      <div className={styles.pendingCard}>
        <span className={styles.pendingBadge}>{badge}</span>
        <h1 className={styles.pendingTitle}>{title}</h1>
        <p className={styles.pendingBody}>{body}</p>
        {adminFeedback && (status === "pending" || status === "rejected" || status === "error") ? (
          <div className={styles.adminFeedbackCard}>
            <div className={styles.adminFeedbackLabel}>Message from EduDeca</div>
            <p className={styles.adminFeedbackBody}>{adminFeedback}</p>
          </div>
        ) : null}
        {status === "pending" || status === "rejected" || status === "error" ? (
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
