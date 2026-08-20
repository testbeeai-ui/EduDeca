"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { isLineupComplete, lineupIds, lineupIdsMatch } from "@/lib/disciplines/selection";
import { isTesterInvestorEmail } from "@/lib/admin/tester-allowlist";
import { fetchServerProgress, patchDisciplines } from "@/lib/progress/client";
import { EDUDECA_PENDING_REFERRER_KEY } from "@/lib/referral/referral-code";
import { isEduDecaStudentEstablished } from "@/lib/signin/returning-login";
import { syncSignupProfileFromLocal } from "@/lib/signin/sync-signup-profile";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

const PROTECTED_ACTIVITY_PATHS = new Set(["/challenge"]);
const COLLEGE_SIGNIN_PATH = "/college/signin";
const COLLEGE_PENDING_PATH = "/college/pending";
const COLLEGE_PORTAL_PATH = "/college/portal";
const COLLEGE_AUTH_REQUIRED_PATHS = new Set([
  COLLEGE_PENDING_PATH,
  COLLEGE_PORTAL_PATH,
]);
const STUDENT_APP_PATHS = new Set([
  "/home",
  "/levels",
  "/leaderboard",
  "/rewards",
  "/profile",
  "/challenge",
  "/signin",
]);
const GET_SESSION_TIMEOUT_MS = 4000;

type CollegeGateStatus = "none" | "pending" | "approved" | "rejected";

async function fetchCollegeGateStatus(): Promise<CollegeGateStatus> {
  try {
    const res = await fetch("/api/college/applications", { credentials: "include" });
    if (!res.ok) return "none";
    const json = (await res.json()) as {
      application?: { status?: string } | null;
    };
    const status = json.application?.status;
    if (status === "pending" || status === "approved" || status === "rejected") {
      return status;
    }
    return "none";
  } catch {
    return "none";
  }
}

async function syncCollegeRosterBestEffort() {
  try {
    await fetch("/api/college/roster/sync", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    /* best-effort */
  }
}

function displayNameFromUser(user: User): string {
  const meta = user.user_metadata ?? {};
  const fromMeta =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    (typeof meta.display_name === "string" && meta.display_name);
  if (fromMeta && fromMeta.trim()) return fromMeta.trim();
  if (user.email) return user.email.split("@")[0] ?? "Student";
  return "Student";
}

function applyUserToStore(user: User | null) {
  const { signIn, signOut, isSignedIn, setStudentCode, setReferralCode } =
    useAppStore.getState();
  if (user) {
    const meta = user.user_metadata ?? {};
    const avatarFromMeta =
      (typeof meta.avatar_url === "string" && meta.avatar_url) ||
      (typeof meta.picture === "string" && meta.picture) ||
      null;
    signIn(displayNameFromUser(user), {
      userId: user.id,
      avatarUrl: avatarFromMeta,
      email: user.email ?? null,
      phone: user.phone ?? null,
    });
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("student_code, edudeca_referral_code")
        .eq("id", user.id)
        .maybeSingle();
      let code =
        data && typeof data.student_code === "string" ? data.student_code : null;
      if (!code?.trim()) {
        const { data: minted } = await supabase.rpc("ensure_my_student_code");
        if (typeof minted === "string") code = minted;
      }
      setStudentCode(code);

      let referral =
        data && typeof data.edudeca_referral_code === "string"
          ? data.edudeca_referral_code
          : null;
      if (!referral?.trim()) {
        const { data: mintedRef } = await supabase.rpc(
          "ensure_my_edudeca_referral_code",
        );
        if (typeof mintedRef === "string") referral = mintedRef;
      }
      setReferralCode(referral);

      try {
        await fetch("/api/referral/claim", {
          method: "POST",
          credentials: "include",
        });
        try {
          sessionStorage.removeItem(EDUDECA_PENDING_REFERRER_KEY);
        } catch {
          /* ignore */
        }
      } catch {
        /* pending claim is best-effort */
      }
    })();
  } else if (isSignedIn) {
    signOut();
  }
}

async function syncProgressFromServer() {
  const progress = await fetchServerProgress();
  if (!progress) return;

  const store = useAppStore.getState();
  store.hydrateProgress(progress);

  const lineup = store.disciplineLineup;
  if (!isLineupComplete(lineup)) return;

  const ids = lineupIds(lineup);
  if (!lineupIdsMatch(progress.disciplines, ids)) {
    const synced = await patchDisciplines(ids);
    if (synced) store.hydrateProgress(synced);
  }
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  const hasHydrated = useAppStore((s) => s.hasHydrated);
  const setHasHydrated = useAppStore((s) => s.setHasHydrated);

  useEffect(() => {
    let mounted = true;

    const finish = () => {
      if (!mounted) return;
      setHasHydrated(true);
    };

    const timeoutId = window.setTimeout(() => {
      if (!mounted) return;
      console.warn("[auth] getSession timed out — continuing with local state");
      finish();
    }, GET_SESSION_TIMEOUT_MS);

    void supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (!mounted) return;
        if (error) console.error("[auth] getSession", error);
        applyUserToStore(data.session?.user ?? null);
        if (data.session?.user) {
          await syncProgressFromServer();
          await syncSignupProfileFromLocal();
          await syncCollegeRosterBestEffort();
        }
        finish();
      })
      .catch((err) => {
        console.error("[auth] getSession threw", err);
        if (!mounted) return;
        finish();
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUserToStore(session?.user ?? null);
      if (session?.user) {
        void (async () => {
          await syncProgressFromServer();
          await syncSignupProfileFromLocal();
          await syncCollegeRosterBestEffort();
        })();
      }
      finish();
    });

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [setHasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isSignedIn && PROTECTED_ACTIVITY_PATHS.has(pathname)) {
      router.replace("/signin");
      return;
    }

    if (!isSignedIn && COLLEGE_AUTH_REQUIRED_PATHS.has(pathname)) {
      router.replace(COLLEGE_SIGNIN_PATH);
      return;
    }

    if (!isSignedIn) return;

    let cancelled = false;
    const email = useAppStore.getState().email;

    void (async () => {
      const collegeStatus = await fetchCollegeGateStatus();
      if (cancelled) return;

      // Testers keep Profile access so they can verify colleges.
      const isTester = isTesterInvestorEmail(email);

      if (collegeStatus === "approved") {
        if (isTester && (pathname === "/profile" || pathname.startsWith("/admin"))) return;
        if (pathname === COLLEGE_SIGNIN_PATH || pathname === COLLEGE_PENDING_PATH) {
          router.replace(COLLEGE_PORTAL_PATH);
          return;
        }
        if (STUDENT_APP_PATHS.has(pathname)) {
          router.replace(COLLEGE_PORTAL_PATH);
          return;
        }
        return;
      }

      if (collegeStatus === "pending" || collegeStatus === "rejected") {
        // One Google email = one role. College applications stay on college
        // pending — never the student app — until approved (or rejected).
        if (isTester && (pathname === "/profile" || pathname.startsWith("/admin"))) return;
        if (pathname === COLLEGE_PENDING_PATH) return;
        router.replace(COLLEGE_PENDING_PATH);
        return;
      }

      // No college application — gate /admin to allowlisted admins only.
      if (pathname.startsWith("/admin") && !isTester) {
        router.replace("/home");
        return;
      }

      // No college application yet — do NOT bounce /college/pending back to
      // sign-in (race: OAuth lands here before POST finishes). Pending page
      // submits the draft and shows the thank-you state itself.
      if (pathname === COLLEGE_PORTAL_PATH) {
        router.replace(COLLEGE_SIGNIN_PATH);
        return;
      }
      if (pathname === "/signin") {
        const store = useAppStore.getState();
        const disciplines = isLineupComplete(store.disciplineLineup)
          ? lineupIds(store.disciplineLineup)
          : [];
        const established = isEduDecaStudentEstablished({
          classLevel: store.signupClassLevel,
          institutionName: store.signupCollege,
          disciplines,
          xp: store.xp,
          campaignLevel: store.campaignLevel,
        });
        if (established) {
          router.replace("/home");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, isSignedIn, pathname, router]);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading EduDeca…</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn && PROTECTED_ACTIVITY_PATHS.has(pathname)) return null;
  if (!isSignedIn && COLLEGE_AUTH_REQUIRED_PATHS.has(pathname)) return null;
  if (isSignedIn && pathname === "/signin") {
    const store = useAppStore.getState();
    const disciplines = isLineupComplete(store.disciplineLineup)
      ? lineupIds(store.disciplineLineup)
      : [];
    const established = isEduDecaStudentEstablished({
      classLevel: store.signupClassLevel,
      institutionName: store.signupCollege,
      disciplines,
      xp: store.xp,
      campaignLevel: store.campaignLevel,
    });
    if (established) return null;
  }

  return <>{children}</>;
}
