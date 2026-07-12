"use client";

import { motion } from "framer-motion";

import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface MotionFadeProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function MotionFade({ children, className, delay = 0 }: MotionFadeProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
