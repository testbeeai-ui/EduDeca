"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export function EduDecaLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <motion.div
        className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-level-violet/30 ring-1 ring-primary/30"
        whileHover={{ rotate: -8, scale: 1.06 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
      >
        <motion.span
          animate={{ rotate: [0, 8, -4, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="inline-flex"
        >
          <Zap className="size-4 text-primary" />
        </motion.span>
      </motion.div>
      {!compact && (
        <span className="text-lg font-bold tracking-tight">
          Edu<span className="text-primary">Deca</span>
        </span>
      )}
    </div>
  );
}
