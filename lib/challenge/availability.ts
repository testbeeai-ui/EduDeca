export const QUESTIONS_UNAVAILABLE = "QUESTIONS_UNAVAILABLE";
export const CLASS_LEVEL_REQUIRED = "CLASS_LEVEL_REQUIRED";
export const CAMPAIGN_LEVEL_MAX = 10;

export type QuestionAvailability = Record<number, boolean>;

export function isLevelReady(ready: QuestionAvailability | null, level: number): boolean | null {
  if (!ready) return null;
  return ready[level] === true;
}

export function isComingSoonPayload(body: {
  code?: string;
  comingSoon?: boolean;
} | null): boolean {
  if (!body) return false;
  return body.comingSoon === true || body.code === QUESTIONS_UNAVAILABLE;
}
