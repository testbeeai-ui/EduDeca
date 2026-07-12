"use client";

import { motion } from "framer-motion";
import {
  Award,
  FlaskConical,
  Flame,
  Gift,
  Handshake,
  Lock,
  Medal,
  Ribbon,
  School,
  Triangle,
  Trophy,
} from "lucide-react";

import { AnimatedNumber } from "@/components/common/animated-number";
import { accentClasses, GlassCard } from "@/components/common/glass-card";
import type { LevelAccent } from "@/lib/types";
import { springSoft, staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

const badgeIconMap = {
  flame: Flame,
  flask: FlaskConical,
  triangle: Triangle,
  handshake: Handshake,
  lock: Lock,
} as const;

const prizeIconMap = {
  trophy: Trophy,
  "medal-1": Medal,
  school: School,
  "medal-2": Award,
  "medal-3": Medal,
  ribbon: Ribbon,
} as const;

interface RewardsHeroProps {
  streakDays: number;
  xp: number;
}

export function RewardsHero({ streakDays, xp }: RewardsHeroProps) {
  return (
    <GlassCard className="relative overflow-hidden" hover>
      <div className="pointer-events-none absolute inset-0 shimmer opacity-30" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-level-violet/10" />
      <div className="relative flex flex-wrap items-center gap-6">
        <div>
          <p className="text-sm text-muted-foreground">Your streak rewards</p>
          <p className="text-3xl font-bold">
            <AnimatedNumber value={streakDays} /> days
          </p>
        </div>
        <div className="h-12 w-px bg-border" aria-hidden />
        <div>
          <p className="text-sm text-muted-foreground">Total XP earned</p>
          <p className="text-3xl font-bold text-primary">
            <AnimatedNumber value={xp} format={{ useGrouping: true }} />
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

interface RewardCardProps {
  title: string;
  subtitle: string;
  icon: string;
  accent: LevelAccent;
}

export function RewardCard({ title, subtitle, icon, accent }: RewardCardProps) {
  const Icon = prizeIconMap[icon as keyof typeof prizeIconMap] ?? Trophy;

  const labelColorClass = cn(
    accent === "amber" && "text-amber-400/90",
    accent === "blue" && "text-blue-400/90",
    accent === "violet" && "text-violet-400/90",
    accent === "rose" && "text-rose-400/90",
    accent === "teal" && "text-teal-400/90"
  );

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={springSoft}
      className={cn(
        "glass flex flex-col items-center justify-center text-center gap-4 rounded-2xl p-5 min-h-[160px]",
        accentClasses(accent)
      )}
    >
      <motion.div
        animate={{ rotate: [0, -6, 6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "flex size-14 items-center justify-center rounded-full bg-white/5 border border-white/10 shadow-inner",
          accent === "amber" && "text-amber-400 bg-amber-400/10 border-amber-500/20",
          accent === "blue" && "text-blue-400 bg-blue-400/10 border-blue-500/20",
          accent === "violet" && "text-violet-400 bg-violet-400/10 border-violet-500/20",
          accent === "rose" && "text-rose-400 bg-rose-400/10 border-rose-500/20",
          accent === "teal" && "text-teal-400 bg-teal-400/10 border-teal-500/20"
        )}
      >
        <Icon className="size-7 shrink-0" />
      </motion.div>
      <div className="flex flex-col gap-1 w-full">
        <p className={cn("text-[11px] font-medium tracking-wider uppercase", labelColorClass)}>
          {title}
        </p>
        <p className="text-lg font-bold text-white tracking-tight">
          {subtitle}
        </p>
      </div>
    </motion.div>
  );
}

export function RewardGrid({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
    >
      {children}
    </motion.div>
  );
}

interface BadgesRowProps {
  badges: Array<{
    id: string;
    label: string;
    icon: string;
    unlocked: boolean;
    accent: LevelAccent;
  }>;
}

export function BadgesRow({ badges }: BadgesRowProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {badges.map((badge, index) => {
        const Icon = badgeIconMap[badge.icon as keyof typeof badgeIconMap] ?? Award;
        return (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
            whileHover={badge.unlocked ? { y: -4, scale: 1.05 } : undefined}
            className={cn(
              "flex w-24 flex-col items-center gap-2 text-center",
              !badge.unlocked && "opacity-50"
            )}
          >
            <div
              className={cn(
                "flex size-14 items-center justify-center rounded-2xl border",
                badge.unlocked ? accentClasses(badge.accent) : "border-border bg-muted/30"
              )}
            >
              <Icon className="size-6" />
            </div>
            <p className="text-xs text-muted-foreground">{badge.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

export function ReferralRewardCard() {
  return (
    <GlassCard className="border-level-blue/30" hover>
      <div className="flex items-start gap-3">
        <motion.div
          className="flex size-10 items-center justify-center rounded-xl bg-level-blue/10 text-level-blue"
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Gift className="size-5" />
        </motion.div>
        <div>
          <h3 className="font-semibold">Refer & earn streak bonuses</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite a classmate — you both get a 2-day streak shield and bonus XP toward Level 4.
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
