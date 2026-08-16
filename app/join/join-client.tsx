"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { normalizeEduDecaReferralCode } from "@/lib/referral/referral-code";

/**
 * Capture ?ref=ED-… into an httpOnly cookie, then send the user to sign-in.
 */
export default function JoinClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Preparing your invite…");

  useEffect(() => {
    const raw = searchParams.get("ref");
    const code = normalizeEduDecaReferralCode(raw);

    void (async () => {
      if (code) {
        try {
          const res = await fetch("/api/referral/pending", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ref: code }),
            credentials: "include",
          });
          if (!res.ok) {
            setMessage("That invite code looks invalid. Taking you to sign-in…");
          } else {
            setMessage("Invite saved. Continue with Google to join EduDeca…");
          }
        } catch {
          setMessage("Could not save invite. Taking you to sign-in…");
        }
      } else {
        setMessage("No invite code found. Taking you to sign-in…");
      }
      window.setTimeout(() => {
        router.replace("/signin");
      }, 600);
    })();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="max-w-sm text-center space-y-3">
        <div className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
