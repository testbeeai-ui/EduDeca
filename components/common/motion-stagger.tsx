"use client";

import { motion } from "framer-motion";

import { staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface MotionStaggerProps {
  children: React.ReactNode;
  className?: string;
}

export function MotionStagger({ children, className }: MotionStaggerProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

export function MotionStaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}
