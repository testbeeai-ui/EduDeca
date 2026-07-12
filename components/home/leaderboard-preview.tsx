"use client";

import { motion } from "framer-motion";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GlassCard } from "@/components/common/glass-card";
import { AnimatedNumber } from "@/components/common/animated-number";
import type { LeaderboardEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LeaderboardPreviewProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardPreview({ entries }: LeaderboardPreviewProps) {
  return (
    <GlassCard hover>
      <h3 className="mb-4 text-sm font-semibold">Top of the leaderboard</h3>
      <ul className="space-y-3">
        {entries.map((entry, index) => (
          <motion.li
            key={entry.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.08, duration: 0.35 }}
            whileHover={{ x: 4 }}
            className="flex items-center gap-3"
          >
            <span className="w-4 text-sm font-bold text-level-amber">{entry.rank}</span>
            <Avatar className="size-8">
              <AvatarFallback className={cn("text-xs font-semibold text-white", entry.avatarColor)}>
                {entry.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{entry.name}</p>
            </div>
            <span className="text-sm font-semibold text-primary">
              <AnimatedNumber value={entry.xp} format={{ useGrouping: true }} /> XP
            </span>
          </motion.li>
        ))}
      </ul>
    </GlassCard>
  );
}
