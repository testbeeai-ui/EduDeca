"use client";

import { useEffect, useState } from "react";

import type { QuestionAvailability } from "@/lib/challenge/availability";
import { createSharedJsonResource } from "@/lib/client/shared-json-resource";

const availabilityResource = createSharedJsonResource<QuestionAvailability>({
  url: "/api/challenge/availability",
  ttlMs: 5_000,
  parse: async (res) => {
    if (!res.ok) return null;
    const body = (await res.json()) as { ready?: QuestionAvailability | null };
    return body.ready ?? null;
  },
});

export function useQuestionAvailability(): QuestionAvailability | null {
  const [ready, setReady] = useState<QuestionAvailability | null>(null);

  useEffect(() => {
    let cancelled = false;
    void availabilityResource.load().then((next) => {
      if (!cancelled && next) setReady(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}
