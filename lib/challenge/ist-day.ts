/** Shared India calendar helpers for daily challenge reset. */

export const EDUDECA_TIMEZONE = "Asia/Kolkata";

/** Calendar date in IST as YYYY-MM-DD. */
export function istDateKey(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: EDUDECA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Milliseconds until next midnight IST. */
export function msUntilNextIstMidnight(now = Date.now()): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: EDUDECA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(now));

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  const hh = get("hour");
  const mm = get("minute");
  const ss = get("second");
  const secondsToday = hh * 3600 + mm * 60 + ss;
  const secondsLeft = 24 * 3600 - secondsToday;
  return (secondsLeft === 0 ? 24 * 3600 : secondsLeft) * 1000;
}

export function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
