"use client";

import { motion } from "framer-motion";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AnimatedNumber } from "@/components/common/animated-number";
import type { LeaderboardEntry } from "@/lib/types";
import { springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  index: number;
}

export function LeaderboardRow({ entry, index }: LeaderboardRowProps) {
  const isTopThree = entry.rank <= 3;
  const isCurrentUser = entry.isCurrentUser;

  return (
    <motion.li
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{
        scale: 1.015,
        boxShadow: "0 0 28px -12px oklch(0.72 0.14 168 / 0.35)",
      }}
      transition={{ ...springSoft, delay: index * 0.05 }}
      className={cn(
        "flex items-center gap-4 rounded-2xl border border-transparent px-4 py-3",
        "hover:border-primary/20 hover:bg-primary/5",
        isCurrentUser && "border-level-amber/50 bg-level-amber/5 glow-amber",
        isTopThree && !isCurrentUser && "bg-muted/30"
      )}
    >
      <span
        className={cn(
          "w-8 text-center text-lg font-bold",
          isTopThree || isCurrentUser ? "text-level-amber" : "text-muted-foreground"
        )}
      >
        {entry.rank}
      </span>
      <Avatar className="size-10">
        <AvatarFallback className={cn("text-sm font-semibold text-white", entry.avatarColor)}>
          {entry.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {entry.name}
          {isCurrentUser && <span className="text-muted-foreground"> (You)</span>}
        </p>
        <p className="truncate text-sm text-muted-foreground">{entry.school}</p>
      </div>
      <span className="text-sm font-semibold text-primary">
        <AnimatedNumber value={entry.xp} format={{ useGrouping: true }} /> XP
      </span>
    </motion.li>
  );
}
