"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { LevelAccent } from "@/lib/types";
import { springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

const accentMap: Record<LevelAccent, string> = {
  teal: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
  violet: "text-violet-300 bg-violet-500/15 border-violet-500/30 shadow-[0_0_12px_rgba(139,92,246,0.2)]",
  amber: "text-amber-300 bg-amber-500/15 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]",
  pink: "text-pink-300 bg-pink-500/15 border-pink-500/30 shadow-[0_0_12px_rgba(236,72,153,0.2)]",
  blue: "text-cyan-300 bg-cyan-500/15 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]",
  rose: "text-rose-300 bg-rose-500/15 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]",
};

export function accentClasses(accent: LevelAccent): string {
  return accentMap[accent] || accentMap.teal;
}

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ className, hover = false, children }: GlassCardProps) {
  const reduceMotion = useReducedMotion();

  if (!hover) {
    return <div className={cn("glass-card card-top-light rounded-2xl p-5", className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn("glass-card card-top-light rounded-2xl p-5 will-change-transform", className)}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -4,
              borderColor: "rgba(255,255,255,0.25)",
              boxShadow: "0 20px 40px -15px rgba(0,0,0,0.6)",
            }
      }
      transition={springSoft}
    >
      {children}
    </motion.div>
  );
}

