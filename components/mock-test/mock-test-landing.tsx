"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Clock, FileText, Play, RefreshCw } from "lucide-react";

import { MOCK_LEVELS, MOCK_SET_COUNT, formatSetNumber, type MockTestLevelId } from "@/lib/mock-test/catalog";
import { mergeProgressStates } from "@/lib/mock-test/attempt-sync";
import { edublastMockHandoffUrl } from "@/lib/mock-test/handoff";
import {
  applyReturnQuery,
  completedSetCountForLevel,
  getMockProgressServerSnapshot,
  getMockProgressSnapshot,
  getSetProgress,
  parseProgressRaw,
  parseReturnQuery,
  saveProgress,
  setLastLevel,
  subscribeMockProgress,
  type MockProgressState,
} from "@/lib/mock-test/progress-store";
import { cn } from "@/lib/utils";

const TAB_TONE: Record<
  MockTestLevelId,
  { icon: string; active: string; progress: string }
> = {
  1: {
    icon: "bg-[#22D3A6] text-[#04140E]",
    active: "border-[rgba(29,158,117,0.6)] bg-[rgba(29,158,117,0.08)]",
    progress: "text-[#22D3A6]",
  },
  2: {
    icon: "bg-[#378ADD] text-[#04140E]",
    active: "border-[rgba(55,138,221,0.6)] bg-[rgba(55,138,221,0.08)]",
    progress: "text-[#378ADD]",
  },
  3: {
    icon: "bg-[#7F77DD] text-[#04140E]",
    active: "border-[rgba(127,119,221,0.6)] bg-[rgba(127,119,221,0.08)]",
    progress: "text-[#7F77DD]",
  },
};

function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function MockTestLanding() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const raw = useSyncExternalStore(
    subscribeMockProgress,
    getMockProgressSnapshot,
    getMockProgressServerSnapshot,
  );
  const stored = useMemo(() => parseProgressRaw(raw), [raw]);
  const [remote, setRemote] = useState<MockProgressState | null>(null);
  const queryString = searchParams.toString();
  const query = useMemo(() => parseReturnQuery(new URLSearchParams(queryString)), [queryString]);
  const local = query ? applyReturnQuery(stored, query) : stored;
  const progress = remote ? mergeProgressStates(remote, local) : local;

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/mock-attempts", { cache: "no-store", credentials: "include" })
      .then(async (res) => {
        if (res.status === 401 || !res.ok) return;
        const body = (await res.json()) as { progress?: unknown };
        if (cancelled || body.progress == null) return;
        setRemote(parseProgressRaw(JSON.stringify(body.progress)));
      })
      .catch(() => {
        // Stay on localStorage if the student is signed out or the API is down.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const parsed = parseReturnQuery(new URLSearchParams(queryString));
    if (!parsed) return;
    const latest = parseProgressRaw(getMockProgressSnapshot());
    saveProgress(browserStorage(), applyReturnQuery(latest, parsed));
    router.replace("/mock-test", { scroll: false });
  }, [queryString, router]);

  useEffect(() => {
    if (!remote && !query) return;
    void fetch("/api/mock-attempts", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress }),
    }).then(async (res) => {
      if (res.status === 401 || !res.ok) return;
      const body = (await res.json()) as { progress?: unknown };
      if (body.progress == null) return;
      setRemote(parseProgressRaw(JSON.stringify(body.progress)));
    }).catch(() => {
      // Keep the local merge if persist is unavailable.
    });
  }, [queryString, remote?.lastLevel]);

  const activeLevel = progress.lastLevel;
  const level = MOCK_LEVELS.find((item) => item.id === activeLevel) ?? MOCK_LEVELS[0];

  function selectLevel(id: MockTestLevelId) {
    saveProgress(browserStorage(), setLastLevel(progress, id));
  }

  return (
    <div className="mx-auto max-w-[1180px] pb-8">
      <section className="relative px-1 pb-2 pt-6 text-center sm:pt-10">
        <div
          className="pointer-events-none absolute left-1/2 top-[-90px] h-[380px] w-[min(760px,100%)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(29,158,117,0.14),transparent_65%)]"
          aria-hidden
        />
        <p className="relative mb-4 inline-flex items-center rounded-full border border-[rgba(240,180,41,0.35)] bg-[rgba(240,180,41,0.1)] px-4 py-1.5 text-[11.5px] font-extrabold tracking-[0.6px] text-[#F0B429]">
          MOCK TEST
        </p>
        <h1 className="relative mx-auto mb-3 max-w-3xl text-[1.75rem] font-extrabold leading-[1.18] text-[#F2F4F8] sm:text-[34px]">
          Practice before you attempt the EduDeca Challenge
        </h1>
        <p className="relative mx-auto max-w-[560px] text-sm leading-[1.65] text-[#8B93A3] sm:text-[14.5px]">
          Free-play mock papers for Levels 1–3 — the same format, timing and difficulty as
          the real thing. Pick a set below and start whenever you&apos;re ready.
        </p>
      </section>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {MOCK_LEVELS.map((item) => {
          const tone = TAB_TONE[item.id];
          const active = item.id === activeLevel;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectLevel(item.id)}
              className={cn(
                "flex min-w-[200px] items-center gap-3 rounded-2xl border-[1.5px] px-5 py-3.5 text-left transition-colors",
                active
                  ? tone.active
                  : "border-[#1E2430] bg-[#131722] hover:border-[#5C6675]",
              )}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-[11px] text-base font-extrabold",
                  tone.icon,
                )}
              >
                {item.id}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-extrabold text-[#F2F4F8]">
                  Level {item.id}
                </span>
                <span className="mt-0.5 block text-[11px] text-[#8B93A3]">{item.sub}</span>
              </span>
              <span className={cn("ml-auto text-xs font-extrabold", tone.progress)}>
                {completedSetCountForLevel(progress, item.id)}/{MOCK_SET_COUNT}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-[#F2F4F8]">{level.title}</h2>
            <p className="mt-1 text-[12.5px] text-[#8B93A3]">
              Set 1 to Set 20 · click any set to begin
            </p>
          </div>
          <div className="flex gap-3.5 text-[11px] text-[#8B93A3]">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#22D3A6]" />
              Start
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#F0B429]" />
              In progress
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#22D3A6]" />
              Completed
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: MOCK_SET_COUNT }, (_, i) => i + 1).map((set) => {
            const saved = getSetProgress(progress, activeLevel, set);
            const status = saved?.status ?? "new";
            return (
              <a
                key={`${activeLevel}-${set}`}
                href={edublastMockHandoffUrl(activeLevel, set)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group relative block rounded-[14px] border bg-[#131722] px-3.5 py-4 text-center transition-transform hover:-translate-y-0.5",
                  status === "completed" && "border-[rgba(29,158,117,0.5)]",
                  status === "inprogress" && "border-[rgba(240,180,41,0.5)]",
                  status === "new" && "border-[#1E2430] hover:border-[#22D3A6]/50",
                )}
              >
                <div className="text-[19px] font-extrabold text-[#F2F4F8]">
                  Set {formatSetNumber(set)}
                </div>
                <div className="mb-2.5 text-[9.5px] font-semibold uppercase tracking-[0.5px] text-[#5C6675]">
                  Level {activeLevel} Mock
                </div>
                <div className="mb-2.5 flex items-center justify-center gap-1.5 text-[10px] text-[#8B93A3]">
                  <FileText className="size-3" />
                  {level.questionCount} Qs
                  <span>·</span>
                  <Clock className="size-3" />
                  {level.duration}
                </div>
                {status === "completed" ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(29,158,117,0.35)] bg-[rgba(29,158,117,0.12)] px-2.5 py-1 text-[9.5px] font-extrabold text-[#22D3A6]">
                    <Check className="size-3" />
                    Completed
                  </span>
                ) : status === "inprogress" ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(240,180,41,0.35)] bg-[rgba(240,180,41,0.12)] px-2.5 py-1 text-[9.5px] font-extrabold text-[#F0B429]">
                    <RefreshCw className="size-3" />
                    In progress
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#1D9E75]/80 bg-[#22D3A6] px-3 py-1.5 text-[10.5px] font-bold text-white shadow-[0_1px_0_rgba(0,0,0,0.22)] transition-colors group-hover:bg-[#3DE0B5] group-hover:text-white">
                    <Play className="size-3 fill-white text-white" />
                    Start
                  </span>
                )}
                {status === "completed" && saved?.scorePct != null ? (
                  <div className="mt-1.5 text-[10px] font-bold text-[#22D3A6]">
                    Best score: {saved.scorePct}%
                  </div>
                ) : null}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
