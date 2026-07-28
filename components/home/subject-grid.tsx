"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { accentClasses } from "@/components/common/glass-card";
import type { Subject } from "@/lib/types";
import { springSoft, staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface SubjectTileProps {
  subject: Subject;
}

function SubjectTile({ subject }: SubjectTileProps) {
  return (
    <motion.button
      type="button"
      variants={staggerItem}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={springSoft}
      className={cn(
        "glass-card card-top-light group flex flex-col justify-between rounded-2xl p-4 text-left relative overflow-hidden transition-all duration-300 min-h-[105px]",
        "hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      )}
    >
      {/* Corner glow hint on hover */}
      <div className="absolute top-0 right-0 size-16 bg-emerald-500/10 rounded-full blur-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />

      <div className="flex items-center justify-between w-full">
        <span
          className={cn(
            "inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-black tracking-wider uppercase font-mono shadow-sm",
            accentClasses(subject.accent)
          )}
        >
          {subject.abbrev}
        </span>
        <span className="text-[11px] font-semibold text-muted-foreground/80 group-hover:text-emerald-400 transition-colors">
          Lv {subject.level}
        </span>
      </div>

      <div className="mt-3">
        <p className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors leading-tight">
          {subject.name}
        </p>
      </div>
    </motion.button>
  );
}

interface SubjectGridProps {
  subjects: Subject[];
}

export function SubjectGrid({ subjects }: SubjectGridProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
    >
      {subjects.map((subject) => (
        <SubjectTile key={subject.id} subject={subject} />
      ))}
    </motion.div>
  );
}

