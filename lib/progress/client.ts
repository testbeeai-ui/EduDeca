import type { EduDecaProgress } from "@/lib/progress/types";

export async function fetchServerProgress(): Promise<EduDecaProgress | null> {
  try {
    const res = await fetch("/api/progress", { method: "GET", cache: "no-store" });
    if (res.status === 401) return null;
    if (!res.ok) {
      console.warn("[progress] load failed", res.status);
      return null;
    }
    const body = (await res.json()) as { progress?: EduDecaProgress };
    return body.progress ?? null;
  } catch (err) {
    console.warn("[progress] load error", err);
    return null;
  }
}

export async function postTesterAction(
  body: { action: "skip_wait" } | { action: "jump_level"; level: 1 | 2 | 3 },
): Promise<EduDecaProgress | null> {
  try {
    const res = await fetch("/api/admin/tester", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn("[admin/tester] failed", res.status);
      return null;
    }
    const json = (await res.json()) as { progress?: EduDecaProgress };
    return json.progress ?? null;
  } catch (err) {
    console.warn("[admin/tester] error", err);
    return null;
  }
}

export async function patchAntiCapture(enabled: boolean): Promise<EduDecaProgress | null> {
  try {
    const res = await fetch("/api/progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ antiCaptureEnabled: enabled }),
    });
    if (!res.ok) {
      console.warn("[progress] anti-capture patch failed", res.status);
      return null;
    }
    const json = (await res.json()) as { progress?: EduDecaProgress };
    return json.progress ?? null;
  } catch (err) {
    console.warn("[progress] anti-capture error", err);
    return null;
  }
}

export async function patchDisciplines(disciplines: string[]): Promise<EduDecaProgress | null> {
  try {
    const res = await fetch("/api/progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disciplines }),
    });
    if (!res.ok) {
      console.warn("[progress] disciplines patch failed", res.status);
      return null;
    }
    const json = (await res.json()) as { progress?: EduDecaProgress };
    return json.progress ?? null;
  } catch (err) {
    console.warn("[progress] disciplines error", err);
    return null;
  }
}
