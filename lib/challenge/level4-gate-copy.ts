/**
 * Level 4 home/challenge copy — unlock / priority access, not bare "coming soon".
 */

export const LEVEL4_HOME_CTA = "Unlock Level 4 · Priority access";

export const LEVEL4_PATH_SUBTITLE = "Unlock Level 4 · Priority access";

export const LEVEL4_GATE_EYEBROW = "Free zone cleared";

export const LEVEL4_GATE_TITLE = "Level up to 4";

export const LEVEL4_GATE_SUBTITLE = "Priority access unlocks the proctored zone";

export const LEVEL4_GATE_BODY =
  "You finished 1–3. Grab priority access so you're first in when Level 4 goes live.";

export const LEVEL4_PERKS = [
  "Verified scores on the national board",
  "Proctored identity for the real rounds",
  "Gate to Levels 4–6 and beyond",
] as const;

export const LEVEL4_PAY_CTA = "Get priority access · ₹999";

export const LEVEL4_WAIT_TITLE = "Hang tight";

export const LEVEL4_WAIT_BODY =
  "Payment isn't live yet. We'll flip checkout on soon — your Level 4 spot stays ready.";

export const LEVEL4_ADMIN_PREVIEW = "Admin · Preview Level 4";

export function isLevel4Campaign(level: number, freeZoneComplete = false): boolean {
  const floor = Math.floor(level);
  // Completing Level 3 sets freeZoneComplete and leaves campaignLevel at 3.
  return floor === 4 || (freeZoneComplete && floor === 3);
}

/** Home/start controls: Level 4 never uses the plain coming-soon dead state. */
export function shouldShowLevel4UnlockCta(
  campaignLevel: number,
  freeZoneComplete = false,
): boolean {
  return isLevel4Campaign(campaignLevel, freeZoneComplete);
}
