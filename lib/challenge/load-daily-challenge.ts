import type { ChallengeQuestion } from "@/lib/types";
import type { EduDecaProgress } from "@/lib/progress/types";

export class ChallengeLoadError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ChallengeLoadError";
  }
}

export async function loadDailyChallenge(
  campaignLevel: number,
  disciplines?: string[] | null,
): Promise<ChallengeQuestion[]> {
  const level = Math.max(1, Math.min(10, Math.floor(campaignLevel) || 1));
  const params = new URLSearchParams({ level: String(level) });
  if (disciplines && disciplines.length === 10) {
    params.set("disciplines", disciplines.join(","));
  }

  const res = await fetch(`/api/challenge/questions?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    let detail = `Failed to load level ${level} questions`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) detail = body.error;
    } catch {
      // ignore
    }
    throw new ChallengeLoadError(detail, res.status);
  }

  const body = (await res.json()) as { questions?: ChallengeQuestion[] };
  if (!Array.isArray(body.questions) || body.questions.length === 0) {
    throw new ChallengeLoadError("Question pack was empty");
  }
  return body.questions;
}

export async function saveChallengeAttempt(payload: {
  reason: string;
  correct: number;
  total: number;
  results: unknown[];
  campaignLevelAtStart: number;
  strikes?: number;
}): Promise<EduDecaProgress | null> {
  try {
    const res = await fetch("/api/challenge/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn("[challenge] save attempt failed", res.status);
      return null;
    }
    const body = (await res.json()) as { progress?: EduDecaProgress };
    return body.progress ?? null;
  } catch (err) {
    console.warn("[challenge] save attempt failed", err);
    return null;
  }
}
