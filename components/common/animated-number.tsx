"use client";

import NumberFlow from "@number-flow/react";

import { cn } from "@/lib/utils";

type NumberFlowFormat = {
  notation?: "standard" | "compact";
  useGrouping?: boolean;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
};

interface AnimatedNumberProps {
  value: number;
  className?: string;
  format?: NumberFlowFormat;
  suffix?: string;
  prefix?: string;
}

export function AnimatedNumber({
  value,
  className,
  format,
  suffix,
  prefix,
}: AnimatedNumberProps) {
  return (
    <span className={cn("inline-flex items-baseline tabular-nums", className)}>
      {prefix}
      <NumberFlow
        value={value}
        format={format ?? { maximumFractionDigits: 0 }}
        transformTiming={{ duration: 650, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        spinTiming={{ duration: 650, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}
      />
      {suffix}
    </span>
  );
}
