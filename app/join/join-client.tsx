"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  EDUDECA_PENDING_REFERRER_KEY,
  displayReferrerName,
  normalizeEduDecaReferralCode,
} from "@/lib/referral/referral-code";

/** Save ?ref=ED-…, show who invited you, then continue to sign-in. */
export default function JoinClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("Preparing your invite…");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => router.replace("/signin"), 4000);
    const code = normalizeEduDecaReferralCode(searchParams.get("ref"));

    void (async () => {
      if (!code) {
        setTitle("No invite code found");
        setReady(true);
        return;
      }
      try {
        const res = await fetch("/api/referral/pending", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ref: code }),
          credentials: "include",
        });
        if (!res.ok) {
          setTitle("That invite code looks invalid");
        } else {
          const payload = (await res.json()) as { name?: string | null };
          const name = displayReferrerName(payload.name);
          try {
            sessionStorage.setItem(EDUDECA_PENDING_REFERRER_KEY, name);
          } catch {
            /* private mode */
          }
          setTitle(`You're joining as a referral of ${name}`);
        }
      } catch {
        setTitle("Could not save invite");
      }
      setReady(true);
    })();

    return () => window.clearTimeout(timer);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-primary/35 bg-card p-8 text-center shadow-2xl">
        {ready ? (
          <p className="text-5xl" aria-hidden>
            🎉
          </p>
        ) : (
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {ready ? (
          <>
            <p className="text-sm text-muted-foreground">
              Your invite is saved. Continue with Google to join EduDeca.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => router.replace("/signin")}
            >
              Continue
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
