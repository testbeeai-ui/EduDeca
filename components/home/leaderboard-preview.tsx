"use client";

import { motion } from "framer-motion";
import { Crown, Trophy, Medal } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AnimatedNumber } from "@/components/common/animated-number";
import type { LeaderboardEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LeaderboardPreviewProps {
  entries: LeaderboardEntry[];
}

const rankBadges = [
  { icon: Crown, color: "text-amber-400 fill-amber-400/20", ring: "ring-2 ring-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.3)]", bg: "bg-amber-500/10" },
  { icon: Trophy, color: "text-slate-300 fill-slate-300/20", ring: "ring-2 ring-slate-300/50 shadow-[0_0_10px_rgba(203,213,225,0.2)]", bg: "bg-slate-500/10" },
  { icon: Medal, color: "text-amber-600 fill-amber-600/20", ring: "ring-2 ring-amber-600/50 shadow-[0_0_10px_rgba(217,119,6,0.2)]", bg: "bg-amber-700/10" },
];

export function LeaderboardPreview({ entries }: LeaderboardPreviewProps) {
  return (
    <div className="glass-card card-top-light rounded-2xl p-5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <Trophy className="size-4 text-amber-400" />
          Top of the Leaderboard
        </h3>
        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
          Live XP
        </span>
      </div>

      <ul className="space-y-3.5">
        {entries.map((entry, index) => {
          const badge = rankBadges[index] || rankBadges[2];
          const RankIcon = badge.icon;

          return (
            <motion.li
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.08, duration: 0.35 }}
              whileHover={{ x: 4 }}
              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="flex size-6 items-center justify-center shrink-0">
                <RankIcon className={cn("size-4", badge.color)} />
              </div>

              <Avatar className={cn("size-8 shrink-0 transition-transform hover:scale-105", badge.ring)}>
                <AvatarFallback className={cn("text-xs font-bold text-white", entry.avatarColor)}>
                  {entry.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{entry.name}</p>
              </div>

              <span className="text-xs font-mono font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                <AnimatedNumber value={entry.xp} format={{ useGrouping: true }} /> XP
              </span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

