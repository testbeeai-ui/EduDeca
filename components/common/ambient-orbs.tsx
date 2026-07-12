"use client";

import { motion, useReducedMotion } from "framer-motion";

export function AmbientOrbs() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-24 top-10 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-16 top-40 size-80 rounded-full bg-level-violet/10 blur-3xl" />
      </div>
    );
  }

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -left-28 top-0 size-[22rem] rounded-full bg-primary/15 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-20 top-24 size-[26rem] rounded-full bg-level-violet/12 blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, 50, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-10 left-1/3 size-[18rem] rounded-full bg-level-amber/8 blur-3xl"
        animate={{ x: [0, 25, 0], y: [0, -20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
