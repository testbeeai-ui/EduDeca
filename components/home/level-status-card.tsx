"use client";

import { Flame, Medal } from "lucide-react";

import type { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LevelStatusCardProps {
  user: UserProfile;
  className?: string;
}

function StaticLevelRing({
  level,
  max = 10,
  size = 88,
  strokeWidth = 5,
}: {
  level: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(level / max, 1);
  const offset = circumference * (1 - progress);

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center">
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-primary"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-lg font-semibold leading-none">{level}</span>
        <span className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">Level</span>
      </div>
    </div>
  );
}

export function LevelStatusCard({ user, className }: LevelStatusCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-transparent p-4 sm:p-5",
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
        <StaticLevelRing level={user.level} />

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-base font-semibold sm:text-lg">
            Level {user.level} · {user.zone}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Flame className="size-4 text-level-amber" />
              {user.streakDays} day streak
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Medal className="size-4 text-level-amber" />
              Rank #{user.rank.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
