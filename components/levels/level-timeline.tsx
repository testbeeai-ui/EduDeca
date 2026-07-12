"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

import type { LevelNode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LevelNodeCardProps {
  level: LevelNode;
  index: number;
}

function getLevelDisplayData(level: LevelNode) {
  let title = level.title;
  let subtitle = level.subtitle;

  if (level.status === "current") {
    title = "You are here";
    if (level.number === 1) subtitle = "Start your first daily challenge";
    if (level.number === 2) subtitle = "Unlock after Level 1";
    if (level.number === 3) subtitle = "Rank, streaks & leaderboard";
  } else if (level.status === "completed") {
    if (level.number === 1) title = "Foundations";
    if (level.number === 2) title = "Building up";
    if (level.number === 3) title = "Free zone complete";
    subtitle = "Completed · 100 XP";
  } else {
    if (level.number === 1) title = "Foundations";
    if (level.number === 2) title = "Building up";
    if (level.number === 3) title = "Free zone complete";
  }

  return { title, subtitle };
}

function LevelNodeCard({ level, index }: LevelNodeCardProps) {
  const isCompleted = level.status === "completed";
  const isCurrent = level.status === "current";
  const isLocked = level.status === "locked";

  const { title, subtitle } = getLevelDisplayData(level);

  const circleClass = cn(
    "flex size-12 shrink-0 items-center justify-center rounded-full text-base font-bold transition-all duration-300 relative z-10",
    isCompleted && "bg-emerald-500 text-slate-950 border-2 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]",
    isCurrent && "bg-amber-500 text-slate-950 border-2 border-amber-400 ring-4 ring-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse",
    isLocked && level.tier === "free" && "bg-slate-950 text-emerald-400/60 border-2 border-emerald-500/50 group-hover:border-emerald-400 group-hover:text-emerald-300 transition-all",
    isLocked && level.tier === "proctored" && "bg-slate-950 text-violet-400/60 border-2 border-violet-500/50 group-hover:border-violet-400 group-hover:text-violet-300 transition-all",
    isLocked && level.tier === "finals" && "bg-slate-950 text-rose-400/60 border-2 border-rose-500/50 group-hover:border-rose-400 group-hover:text-rose-300 transition-all"
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className={cn(
        "flex items-center gap-4 w-full py-3 px-3 rounded-2xl transition-all duration-200 group relative",
        isCurrent ? "bg-amber-500/5" : "hover:bg-white/5",
        isLocked && "opacity-60 hover:opacity-100"
      )}
    >
      <div className={circleClass}>
        {level.number}
      </div>

      <div className="flex-grow min-w-0">
        <p className={cn(
          "font-semibold text-sm sm:text-base transition-colors",
          isCompleted && "text-emerald-400",
          isCurrent && "text-amber-400 font-bold",
          isLocked && "text-slate-200 group-hover:text-white"
        )}>
          Level {level.number} — {title}
        </p>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5 truncate transition-colors group-hover:text-slate-300">
          {subtitle}
        </p>
      </div>

      {level.price && (
        <span className="text-xs font-semibold text-violet-400 bg-violet-400/10 px-2.5 py-1 rounded-full shrink-0">
          {level.price}
        </span>
      )}

      {level.number === 7 && (
        <div className="absolute right-[-40px] top-1/2 -translate-y-1/2 text-level-amber z-20">
          <Trophy className="size-5" />
        </div>
      )}
    </motion.div>
  );
}

interface LevelTimelineProps {
  levels: LevelNode[];
}

export function LevelTimeline({ levels }: LevelTimelineProps) {
  const oddLevels = levels.filter((l) => l.number % 2 !== 0);
  const evenLevels = levels.filter((l) => l.number % 2 === 0);

  return (
    <div className="relative mx-auto max-w-5xl py-4">
      {/* ================= DESKTOP VIEWPORT LAYOUT ================= */}
      <div className="hidden md:grid grid-cols-2 gap-x-16 relative">
        {/* Left Column (Odd levels) */}
        <div className="space-y-6 relative">
          <div
            className="absolute top-4 bottom-4 w-0.5 bg-gradient-to-b from-emerald-500/40 via-violet-500/40 to-rose-500/40 left-[36px] z-0 pointer-events-none"
            aria-hidden
          />
          {oddLevels.map((level, index) => (
            <LevelNodeCard key={level.number} level={level} index={index * 2} />
          ))}
        </div>

        {/* Right Column (Even levels) */}
        <div className="space-y-6 relative">
          <div
            className="absolute top-4 bottom-4 w-0.5 bg-gradient-to-b from-emerald-500/40 via-violet-500/40 to-rose-500/40 left-[36px] z-0 pointer-events-none"
            aria-hidden
          />
          {evenLevels.map((level, index) => (
            <LevelNodeCard key={level.number} level={level} index={index * 2 + 1} />
          ))}
        </div>
      </div>

      {/* ================= MOBILE VIEWPORT LAYOUT ================= */}
      <div className="relative md:hidden space-y-6">
        {/* Mobile Single Timeline Line */}
        <div
          className="absolute top-4 bottom-4 w-0.5 bg-gradient-to-b from-emerald-500/40 via-violet-500/40 to-rose-500/40 left-[36px] z-0 pointer-events-none"
          aria-hidden
        />
        
        {levels.map((level, index) => (
          <LevelNodeCard key={level.number} level={level} index={index} />
        ))}
      </div>
    </div>
  );
}
