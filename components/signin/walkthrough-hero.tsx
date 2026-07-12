"use client";

import { motion } from "framer-motion";
import {
  Flame,
  GraduationCap,
  Lock,
  Phone,
  Target,
  Trophy,
} from "lucide-react";

import { accentClasses } from "@/components/common/glass-card";
import type { LevelAccent } from "@/lib/types";
import { floatSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

const iconMap = {
  target: Target,
  flame: Flame,
  trophy: Trophy,
  lock: Lock,
  graduation: GraduationCap,
  phone: Phone,
} as const;

interface WalkthroughHeroProps {
  icon: string;
  accent: LevelAccent;
  className?: string;
}

export function WalkthroughHero({ icon, accent, className }: WalkthroughHeroProps) {
  const Icon = iconMap[icon as keyof typeof iconMap] ?? Target;

  return (
    <motion.div
      className={cn(
        "mx-auto flex h-40 w-full max-w-lg items-center justify-center rounded-3xl border sm:h-48",
        accentClasses(accent),
        className
      )}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div variants={floatSoft} animate="animate">
        <Icon className="size-16 opacity-90 sm:size-20" strokeWidth={1.25} />
      </motion.div>
    </motion.div>
  );
}
