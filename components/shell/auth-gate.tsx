"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { fetchServerProgress, patchDisciplines } from "@/lib/progress/client";
import { isLineupComplete, lineupIds } from "@/lib/disciplines/selection";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

const PROTECTED_ACTIVITY_PATHS = new Set(["/challenge"]);
const GET_SESSION_TIMEOUT_MS = 4000;

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

  // Push local walkthrough lineup if server has none yet.
  if (!progress.disciplines?.length && isLineupComplete(store.disciplineLineup)) {
    const synced = await patchDisciplines(lineupIds(store.disciplineLineup));
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
        void syncProgressFromServer();
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

    if (isSignedIn && pathname === "/signin") {
      router.replace("/home");
    }
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
  if (isSignedIn && pathname === "/signin") return null;

  return <>{children}</>;
}
