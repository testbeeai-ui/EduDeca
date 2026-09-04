import type { MockTestLevelId } from "./catalog";

export const LIVE_EDUBLAST_APP_URL = "https://www.edublast.in";

function hostnameOf(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    return new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`).hostname;
  } catch {
    return "";
  }
}

function isLocalDevHost(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1";
}

function currentPageHost(explicit?: string): string {
  if (explicit) return hostnameOf(explicit);
  if (typeof window !== "undefined") return window.location.hostname;
  return "";
}

export function edublastAppOrigin(
  raw = process.env.NEXT_PUBLIC_EDUBLAST_APP_URL,
  pageHost?: string,
): string {
  const configured = (raw?.trim() || LIVE_EDUBLAST_APP_URL).replace(/\/$/, "");
  if (!isLocalDevHost(hostnameOf(configured))) return configured;

  const host = currentPageHost(pageHost);
  const allowLocalWeb =
    process.env.NODE_ENV !== "production" && (!host || isLocalDevHost(host));
  return allowLocalWeb ? configured : LIVE_EDUBLAST_APP_URL;
}

export function edublastMockHandoffUrl(
  level: MockTestLevelId,
  set: number,
  origin = edublastAppOrigin(),
): string {
  const url = new URL("/edudeca-mock", edublastAppOrigin(origin));
  url.searchParams.set("level", String(level));
  url.searchParams.set("set", String(set));
  return url.toString();
}
