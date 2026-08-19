"use client";

import { BadgePill } from "@/components/common/badge-pill";
import type { WalkthroughStep } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StepPillsProps {
  steps: WalkthroughStep[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function StepPills({ steps, currentStep, onStepClick }: StepPillsProps) {
  return (
    <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="mx-auto flex w-max max-w-full flex-nowrap items-center justify-center gap-2 px-1">
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => onStepClick?.(step.id)}
            className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <BadgePill accent={step.accent} active={step.id <= currentStep} className="whitespace-nowrap">
              {step.pillLabel}
            </BadgePill>
          </button>
        ))}
      </div>
    </div>
  );
}

interface StepDotsProps {
  total: number;
  current: number;
}

export function StepDots({ total, current }: StepDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === current;
        return (
          <span
            key={stepNum}
            className={cn(
              "rounded-full transition-all",
              isActive ? "h-2 w-6 bg-primary" : "size-2 bg-muted-foreground/30"
            )}
            aria-hidden
          />
        );
      })}
    </div>
  );
}
