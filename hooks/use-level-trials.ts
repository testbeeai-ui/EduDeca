"use client";

import { useEffect, useState } from "react";

import type { TrialGateReason } from "@/lib/challenge/trials";
import { createSharedJsonResource } from "@/lib/client/shared-json-resource";

export type LevelTrialsState = {
  level: number;
  unlimited: boolean;
  failCount: number;
  remaining: number | null;
  limit: number;
  gate: TrialGateReason;
};

const trialsResource = createSharedJsonResource<LevelTrialsState>({
  url: "/api/challenge/trials",
  ttlMs: 0,
  parse: async (res) => {
    if (!res.ok) return null;
    return (await res.json()) as LevelTrialsState;
  },
});

export function useLevelTrials(enabled: boolean): {
  trials: LevelTrialsState | null;
  loading: boolean;
} {
  const [trials, setTrials] = useState<LevelTrialsState | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void trialsResource
      .load()
      .then((next) => {
        if (!cancelled && next) setTrials(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { trials, loading };
}
