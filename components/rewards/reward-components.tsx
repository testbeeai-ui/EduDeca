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

import { accentClasses } from "@/components/common/glass-card";
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

interface RewardCardProps {
  title: string;
  subtitle: string;
  icon: string;
  accent: LevelAccent;
}

export function RewardCard({ title, subtitle, icon, accent }: RewardCardProps) {
  const Icon = prizeIconMap[icon as keyof typeof prizeIconMap] ?? Trophy;

  const labelColorClass = cn(
    accent === "amber" && "text-amber-400",
    accent === "blue" && "text-cyan-400",
    accent === "violet" && "text-violet-400",
    accent === "rose" && "text-rose-400",
    accent === "teal" && "text-emerald-400",
    accent === "pink" && "text-pink-400"
  );

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -6, scale: 1.03 }}
      transition={springSoft}
      className={cn(
        "glass-card card-top-light flex flex-col items-center justify-center text-center gap-4 rounded-2xl p-5 min-h-[170px] relative overflow-hidden transition-all duration-300",
        accentClasses(accent)
      )}
    >
      <motion.div
        animate={{ rotate: [0, -6, 6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "flex size-14 items-center justify-center rounded-2xl border shadow-lg transition-transform",
          accent === "amber" && "text-amber-400 bg-amber-500/20 border-amber-400/40 shadow-amber-500/20",
          accent === "blue" && "text-cyan-400 bg-cyan-500/20 border-cyan-400/40 shadow-cyan-500/20",
          accent === "violet" && "text-violet-400 bg-violet-500/20 border-violet-400/40 shadow-violet-500/20",
          accent === "rose" && "text-rose-400 bg-rose-500/20 border-rose-400/40 shadow-rose-500/20",
          accent === "teal" && "text-emerald-400 bg-emerald-500/20 border-emerald-400/40 shadow-emerald-500/20",
          accent === "pink" && "text-pink-400 bg-pink-500/20 border-pink-400/40 shadow-pink-500/20"
        )}
      >
        <Icon className="size-7 shrink-0 stroke-[2.2]" />
      </motion.div>
      <div className="flex flex-col gap-1 w-full">
        <p className={cn("text-[10px] font-extrabold tracking-widest uppercase font-mono", labelColorClass)}>
          {title}
        </p>
        <p className="text-xl font-extrabold text-white tracking-tight">
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
      className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
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
    <div className="flex flex-wrap gap-4 sm:gap-5">
      {badges.map((badge, index) => {
        const Icon = badgeIconMap[badge.icon as keyof typeof badgeIconMap] ?? Award;
        return (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
            whileHover={badge.unlocked ? { y: -5, scale: 1.06 } : undefined}
            className={cn(
              "flex w-24 flex-col items-center gap-2 text-center group cursor-pointer",
              !badge.unlocked && "opacity-55"
            )}
          >
            <div
              className={cn(
                "flex size-14 items-center justify-center rounded-2xl border transition-all duration-300 shadow-md",
                badge.unlocked
                  ? accentClasses(badge.accent)
                  : "border-white/10 bg-slate-900/60 text-muted-foreground group-hover:border-white/20"
              )}
            >
              <Icon className={cn("size-6", badge.unlocked ? "stroke-[2.2]" : "opacity-60")} />
            </div>
            <p className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{badge.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

export function ReferralRewardCard() {
  return (
    <div className="glass-card card-top-light rounded-2xl p-5 relative overflow-hidden border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-card/80 to-cyan-500/5 shadow-xl">
      <div className="flex items-start gap-4">
        <motion.div
          className="flex size-12 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 shadow-lg shadow-cyan-500/20 shrink-0"
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Gift className="size-6 text-cyan-300" />
        </motion.div>
        <div className="space-y-1.5">
          <h3 className="font-bold text-white text-base tracking-tight">Refer & Earn Streak Bonuses</h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Invite a classmate — you both get a 2-day streak shield and bonus XP toward Level 4.
          </p>
        </div>
      </div>
    </div>
  );
}

