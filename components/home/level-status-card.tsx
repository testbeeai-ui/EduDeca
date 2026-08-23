"use client";

import { Medal, Sparkles } from "lucide-react";

import type { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LevelStatusCardProps {
  user: UserProfile;
  className?: string;
}

function StaticLevelRing({
  level,
  max = 10,
  size = 92,
  strokeWidth = 6,
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
    <div className="relative inline-flex shrink-0 items-center justify-center group">
      {/* Outer ambient glow */}
      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-30 blur-md transition-opacity duration-300 group-hover:opacity-60" />
      
      <svg width={size} height={size} className="-rotate-90 relative" aria-hidden>
        <defs>
          <linearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#levelGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold leading-none tracking-tight text-white">{level}</span>
        <span className="mt-1 text-[9px] font-bold uppercase tracking-widest text-emerald-400">Level</span>
      </div>
    </div>
  );
}

export function LevelStatusCard({ user, className }: LevelStatusCardProps) {
  return (
    <div
      className={cn(
        "glass-card card-top-light rounded-2xl p-5 sm:p-6 overflow-hidden",
        className
      )}
    >
      {/* Ambient background highlight */}
      <div className="absolute -top-12 -left-12 size-36 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <StaticLevelRing level={user.level} />

        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white sm:text-xl tracking-tight">
              Level {user.level} <span className="text-emerald-400">·</span> {user.zone}
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
              <Sparkles className="size-3 text-emerald-400" /> Active Tier
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-cyan-300 font-medium">
              <Medal className="size-4 text-cyan-400" />
              Rank #{user.rank.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

