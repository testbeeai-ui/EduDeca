"use client";

import { motion } from "framer-motion";
import { Crown, Trophy, Medal, Sparkles } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AnimatedNumber } from "@/components/common/animated-number";
import type { LeaderboardEntry } from "@/lib/types";
import { springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  index: number;
}

const rankThemeMap: Record<number, { ring: string; text: string; bg: string }> = {
  1: { ring: "ring-2 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]", text: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
  2: { ring: "ring-2 ring-slate-300 shadow-[0_0_12px_rgba(203,213,225,0.3)]", text: "text-slate-300", bg: "bg-slate-500/10 border-slate-500/30" },
  3: { ring: "ring-2 ring-amber-600 shadow-[0_0_12px_rgba(217,119,6,0.3)]", text: "text-amber-500", bg: "bg-amber-700/10 border-amber-700/30" },
};

export function LeaderboardRow({ entry, index }: LeaderboardRowProps) {
  const isTopThree = entry.rank <= 3;
  const isCurrentUser = entry.isCurrentUser;
  const rankTheme = rankThemeMap[entry.rank];

  return (
    <motion.li
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{
        scale: 1.012,
        boxShadow: "0 8px 30px -10px rgba(16, 185, 129, 0.25)",
      }}
      transition={{ ...springSoft, delay: index * 0.04 }}
      className={cn(
        "flex items-center gap-4 rounded-2xl border px-4 py-3.5 transition-all duration-300 relative overflow-hidden backdrop-blur-xl",
        isCurrentUser
          ? "border-amber-400/60 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 shadow-[0_0_30px_rgba(245,158,11,0.25)]"
          : isTopThree
          ? `${rankTheme?.bg} border-white/10`
          : "border-white/5 bg-card/40 hover:bg-white/5 hover:border-white/15"
      )}
    >
      {/* Current user glowing bar */}
      {isCurrentUser && (
        <span className="absolute left-0 inset-y-0 w-1 bg-gradient-to-b from-amber-300 to-amber-500 rounded-r-full shadow-[0_0_10px_#f59e0b]" />
      )}

      <div className="flex size-8 items-center justify-center shrink-0">
        {entry.rank === 1 ? (
          <Crown className="size-5 text-amber-400 fill-amber-400/30" />
        ) : entry.rank === 2 ? (
          <Trophy className="size-5 text-slate-300 fill-slate-300/30" />
        ) : entry.rank === 3 ? (
          <Medal className="size-5 text-amber-500 fill-amber-500/30" />
        ) : (
          <span className={cn("text-base font-extrabold font-mono", isCurrentUser ? "text-amber-400" : "text-muted-foreground")}>
            {entry.rank}
          </span>
        )}
      </div>

      <Avatar className={cn("size-10 shrink-0 transition-transform hover:scale-105", rankTheme?.ring)}>
        <AvatarFallback className={cn("text-sm font-extrabold text-white", entry.avatarColor)}>
          {entry.name.charAt(0)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="font-bold text-white text-sm sm:text-base flex items-center gap-2 truncate">
          {entry.name}
          {isCurrentUser && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 text-[10px] font-extrabold text-amber-300">
              <Sparkles className="size-3 text-amber-400" /> You
            </span>
          )}
        </p>
        <p className="truncate text-xs text-muted-foreground mt-0.5">{entry.school}</p>
      </div>

      <span className="text-xs sm:text-sm font-mono font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-xl shadow-sm">
        <AnimatedNumber value={entry.xp} format={{ useGrouping: true }} /> XP
      </span>
    </motion.li>
  );
}

