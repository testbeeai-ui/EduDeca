"use client";

import { zoneForLevel } from "@/lib/challenge/get-level-path";
import { formatXp } from "@/lib/utils";
import { useProgressUser } from "@/store/useAppStore";

export function ProgressHeader() {
  const { level, xp, streakDays } = useProgressUser();

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border/70 bg-transparent px-3 py-2.5 sm:gap-x-6 sm:px-4">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Current level
        </p>
        <p className="text-sm font-semibold sm:text-base">
          Level {level} · {zoneForLevel(level)}
        </p>
      </div>
      <div className="hidden h-8 w-px bg-border sm:block" aria-hidden />
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Total XP
        </p>
        <p className="text-sm font-semibold text-primary sm:text-base">{formatXp(xp)}</p>
      </div>
      <div className="hidden h-8 w-px bg-border sm:block" aria-hidden />
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Streak
        </p>
        <p className="text-sm font-semibold sm:text-base">{streakDays} day</p>
      </div>
    </div>
  );
}
