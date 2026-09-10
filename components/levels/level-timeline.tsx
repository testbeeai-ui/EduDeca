"use client";

import { motion } from "framer-motion";
import { Trophy, Lock, Check, Clock } from "lucide-react";

import type { LevelNode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LevelNodeCardProps {
  level: LevelNode;
  index: number;
}

function getLevelDisplayData(level: LevelNode) {
  let title = level.title;
  let subtitle = level.subtitle;

  if (level.comingSoon && level.status !== "completed") {
    subtitle = "Coming soon";
  }

  if (level.status === "current") {
    title = "You are here";
    if (!level.comingSoon) {
      if (level.number === 1) subtitle = "Start your first daily challenge";
      if (level.number === 2) subtitle = "Unlock after Level 1";
      if (level.number === 3) subtitle = "Rank, streaks & leaderboard";
    }
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
    "flex size-12 shrink-0 items-center justify-center rounded-full text-base font-extrabold transition-all duration-300 relative z-10 shadow-lg",
    isCompleted && "bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 border-2 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)]",
    isCurrent && "bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 border-2 border-amber-200 ring-4 ring-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.6)]",

    isLocked && level.tier === "free" && "bg-slate-900 text-emerald-400/80 border-2 border-emerald-500/40 group-hover:border-emerald-400 group-hover:text-emerald-300",
    isLocked && level.tier === "proctored" && "bg-slate-900 text-violet-400/80 border-2 border-violet-500/40 group-hover:border-violet-400 group-hover:text-violet-300",
    isLocked && level.tier === "finals" && "bg-slate-900 text-rose-400/80 border-2 border-rose-500/40 group-hover:border-rose-400 group-hover:text-rose-300"
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className={cn(
        "flex items-center gap-4 w-full py-3 px-3.5 rounded-2xl transition-all duration-300 group relative border border-transparent",
        isCurrent ? "bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-500/5" : "hover:bg-white/5 hover:border-white/10",
        isLocked && "opacity-75 hover:opacity-100"
      )}
    >
      <div className={circleClass}>
        {isCompleted ? (
          <Check className="size-5 stroke-[3]" />
        ) : (
          level.number
        )}
      </div>

      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(
            "font-bold text-sm sm:text-base transition-colors tracking-tight",
            isCompleted && "text-emerald-400",
            isCurrent && "text-amber-400 font-extrabold",
            isLocked && "text-slate-100 group-hover:text-white"
          )}>
            Level {level.number} — {title}
          </p>
          {isLocked && !level.comingSoon && (
            <Lock className="size-3.5 text-muted-foreground/60 shrink-0" />
          )}
          {level.comingSoon && level.status !== "completed" && (
            <Clock className="size-3.5 text-amber-300/80 shrink-0" />
          )}
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5 truncate transition-colors group-hover:text-slate-300">
          {subtitle}
        </p>
      </div>

      {level.price && (
        <span className="text-xs font-mono font-bold text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2.5 py-1 rounded-full shrink-0 shadow-sm">
          {level.price}
        </span>
      )}

      {level.number === 7 && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 z-20 animate-bounce">
          <Trophy className="size-5 text-amber-400 fill-amber-400/20" />
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
            className="absolute top-4 bottom-4 w-1 bg-gradient-to-b from-emerald-400 via-violet-500 to-rose-500 left-[35px] z-0 pointer-events-none rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            aria-hidden
          />
          {oddLevels.map((level, index) => (
            <LevelNodeCard key={level.number} level={level} index={index * 2} />
          ))}
        </div>

        {/* Right Column (Even levels) */}
        <div className="space-y-6 relative">
          <div
            className="absolute top-4 bottom-4 w-1 bg-gradient-to-b from-emerald-400 via-violet-500 to-rose-500 left-[35px] z-0 pointer-events-none rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"
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
          className="absolute top-4 bottom-4 w-1 bg-gradient-to-b from-emerald-400 via-violet-500 to-rose-500 left-[35px] z-0 pointer-events-none rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          aria-hidden
        />
        
        {levels.map((level, index) => (
          <LevelNodeCard key={level.number} level={level} index={index} />
        ))}
      </div>
    </div>
  );
}

