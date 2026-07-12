"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { LevelAccent } from "@/lib/types";
import { springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

const accentMap: Record<LevelAccent, string> = {
  teal: "text-level-teal bg-level-teal/10 border-level-teal/20",
  violet: "text-level-violet bg-level-violet/10 border-level-violet/20",
  amber: "text-level-amber bg-level-amber/10 border-level-amber/20",
  pink: "text-level-pink bg-level-pink/10 border-level-pink/20",
  blue: "text-level-blue bg-level-blue/10 border-level-blue/20",
  rose: "text-level-rose bg-level-rose/10 border-level-rose/20",
};

export function accentClasses(accent: LevelAccent): string {
  return accentMap[accent];
}

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ className, hover = false, children }: GlassCardProps) {
  const reduceMotion = useReducedMotion();

  if (!hover) {
    return <div className={cn("glass rounded-2xl p-5", className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn("glass rounded-2xl p-5 will-change-transform", className)}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -4,
              borderColor: "rgba(255,255,255,0.22)",
              boxShadow: "0 18px 40px -20px rgba(0,0,0,0.55)",
            }
      }
      transition={springSoft}
    >
      {children}
    </motion.div>
  );
}
