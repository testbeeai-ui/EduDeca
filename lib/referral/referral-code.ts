/**
 * EduDeca referral code: ED-{YY}{D}{L}{D}{L}{D}{L}{D}{L}
 * Example: ED-267K2M9Q4A
 * Must never match Student ID EB-{YY}{L}{D}{L}{D}{L}{D}.
 */
const REFERRAL_CODE_RE = /^ED-\d{2}([0-9][A-Z]){4}$/;

export const EDUDECA_PENDING_REF_COOKIE = "edudeca_pending_ref";

export function hasPendingReferralCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((part) => {
    const trimmed = part.trim();
    if (!trimmed.startsWith(`${EDUDECA_PENDING_REF_COOKIE}=`)) return false;
    const value = decodeURIComponent(trimmed.slice(EDUDECA_PENDING_REF_COOKIE.length + 1));
    return Boolean(normalizeEduDecaReferralCode(value));
  });
}

export function normalizeEduDecaReferralCode(
  code: string | null | undefined,
): string | null {
  if (!code) return null;
  const trimmed = code.trim().toUpperCase();
  if (!REFERRAL_CODE_RE.test(trimmed)) return null;
  return trimmed;
}

export function buildEduDecaShareUrl(origin: string, code: string): string {
  const normalized = normalizeEduDecaReferralCode(code);
  const base = origin.replace(/\/$/, "");
  if (!normalized) return `${base}/join`;
  return `${base}/join?ref=${encodeURIComponent(normalized)}`;
}

export const EDUDECA_PENDING_REFERRER_KEY = "edudeca_pending_referrer_preview";

/** Profile name for join copy; emails collapse to a first token. */
export function displayReferrerName(name: string | null | undefined): string {
  const raw = (name ?? "").trim();
  if (!raw) return "a friend";
  if (!raw.includes("@")) return raw;
  const token = raw.split(/[@._-]/).find((part) => part.length > 0) ?? "";
  return token ? token.charAt(0).toUpperCase() + token.slice(1) : "a friend";
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return (parts[0]!.slice(0, 1) + parts[parts.length - 1]!.slice(0, 1)).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-rose-400",
  "bg-blue-400",
  "bg-amber-400",
  "bg-violet-500",
  "bg-emerald-400",
  "bg-cyan-400",
] as const;

export function avatarColorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i) * (i + 1)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[hash] ?? AVATAR_COLORS[0];
}
