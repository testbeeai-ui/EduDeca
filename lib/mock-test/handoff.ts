import type { MockTestLevelId } from "./catalog";

export const DEFAULT_EDUBLAST_APP_URL = "http://localhost:3000";

export function edublastAppOrigin(raw = process.env.NEXT_PUBLIC_EDUBLAST_APP_URL): string {
  const origin = (raw?.trim() || DEFAULT_EDUBLAST_APP_URL).replace(/\/$/, "");
  return origin;
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
