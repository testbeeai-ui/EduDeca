"use client";

import { motion } from "framer-motion";

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
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={springSoft}
      className={cn(
        "glass group flex flex-col items-start gap-3 rounded-2xl p-4 text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      <span
        className={cn(
          "inline-flex rounded-lg border px-2 py-1 text-[10px] font-bold tracking-wider",
          accentClasses(subject.accent)
        )}
      >
        {subject.abbrev}
      </span>
      <div>
        <p className="text-sm font-medium">{subject.name}</p>
        <p className="text-xs text-muted-foreground">Lv {subject.level}</p>
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
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
    >
      {subjects.map((subject) => (
        <SubjectTile key={subject.id} subject={subject} />
      ))}
    </motion.div>
  );
}
