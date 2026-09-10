"use client";

import { useEffect, useState } from "react";

import type { TrialGateReason } from "@/lib/challenge/trials";
import { useAppStore } from "@/store/useAppStore";

export type ChallengeTrialsStatus = {
  level: number;
  unlimited: boolean;
  failCount: number;
  remaining: number | null;
  limit: number;
  gate: TrialGateReason;
};

export function useChallengeTrials(): ChallengeTrialsStatus | null {
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  const [status, setStatus] = useState<ChallengeTrialsStatus | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setStatus(null);
      return;
    }
    let cancelled = false;
    void fetch("/api/challenge/trials", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as ChallengeTrialsStatus;
      })
      .then((next) => {
        if (!cancelled && next) setStatus(next);
      })
      .catch(() => {
        // Keep null — callers treat unknown as "don't block start yet".
      });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  return status;
}
