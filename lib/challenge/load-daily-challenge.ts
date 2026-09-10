import {
  CLASS_LEVEL_REQUIRED,
  isComingSoonPayload,
} from "@/lib/challenge/availability";
import type { LevelTrialsSnapshot } from "@/lib/challenge/trials";
import type { EduDecaProgress } from "@/lib/progress/types";
import type { ChallengeQuestion } from "@/lib/types";

export { CLASS_LEVEL_REQUIRED };

export class ChallengeLoadError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly comingSoon = false,
    readonly gateCode?: string,
  ) {
    super(message);
    this.name = "ChallengeLoadError";
  }
}

export function shouldRedirectChallengeLoadToSignin(error: unknown): boolean {
  return (
    error instanceof ChallengeLoadError &&
    (error.status === 401 || error.gateCode === CLASS_LEVEL_REQUIRED)
  );
}

let inflight: Promise<ChallengeQuestion[]> | null = null;
let inflightKey = "";

export async function loadDailyChallenge(
  campaignLevel: number,
  disciplines?: string[] | null,
): Promise<ChallengeQuestion[]> {
  const level = Math.max(1, Math.min(10, Math.floor(campaignLevel) || 1));
  const params = new URLSearchParams({ level: String(level) });
  if (disciplines && disciplines.length === 10) {
    params.set("disciplines", disciplines.join(","));
  }
  const key = params.toString();
  if (inflight && inflightKey === key) return inflight;

  inflightKey = key;
  inflight = fetchQuestions(key).finally(() => {
    inflight = null;
    inflightKey = "";
  });
  return inflight;
}

async function fetchQuestions(query: string): Promise<ChallengeQuestion[]> {
  const res = await fetch(`/api/challenge/questions?${query}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    let detail = "Failed to load questions";
    let comingSoon = res.status === 404;
    try {
      const body = (await res.json()) as {
        error?: string;
        code?: string;
        comingSoon?: boolean;
      };
      if (body.error) detail = body.error;
      comingSoon =
        body.code === CLASS_LEVEL_REQUIRED ? false : isComingSoonPayload(body) || comingSoon;
      throw new ChallengeLoadError(detail, res.status, comingSoon, body.code);
    } catch (err) {
      if (err instanceof ChallengeLoadError) throw err;
    }
    throw new ChallengeLoadError(detail, res.status, comingSoon);
  }

  const body = (await res.json()) as { questions?: ChallengeQuestion[] };
  if (!Array.isArray(body.questions) || body.questions.length === 0) {
    throw new ChallengeLoadError("Question pack was empty", res.status, true);
  }
  return body.questions;
}

export type ChallengeCompleteSaveResult = {
  progress: EduDecaProgress | null;
  trials: LevelTrialsSnapshot | null;
};

export async function saveChallengeAttempt(payload: {
  reason: string;
  correct: number;
  total: number;
  results: unknown[];
  campaignLevelAtStart: number;
  strikes?: number;
}): Promise<ChallengeCompleteSaveResult> {
  try {
    const res = await fetch("/api/challenge/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn("[challenge] save attempt failed", res.status);
      return { progress: null, trials: null };
    }
    const body = (await res.json()) as {
      progress?: EduDecaProgress;
      trials?: LevelTrialsSnapshot;
    };
    return {
      progress: body.progress ?? null,
      trials: body.trials ?? null,
    };
  } catch (err) {
    console.warn("[challenge] save attempt failed", err);
    return { progress: null, trials: null };
  }
}
