"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { BadgePill } from "@/components/common/badge-pill";
import { WalkthroughHero } from "@/components/signin/walkthrough-hero";
import { GoogleSignInForm } from "@/components/signin/google-sign-in";
import { StepDots, StepPills } from "@/components/signin/step-pills";
import { Button } from "@/components/ui/button";
import type { WalkthroughStep } from "@/lib/types";

interface WalkthroughStepCardProps {
  steps: WalkthroughStep[];
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  onStepClick: (step: number) => void;
  onSkipToSignIn: () => void;
}

export function WalkthroughStepCard({
  steps,
  currentStep,
  onNext,
  onBack,
  onStepClick,
  onSkipToSignIn,
}: WalkthroughStepCardProps) {
  const step = steps[currentStep - 1];
  const isLastStep = currentStep === steps.length;

  if (!step) return null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 sm:gap-8">
      <div className="flex items-center justify-between">
        {!isLastStep ? (
          <button
            type="button"
            onClick={onSkipToSignIn}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip → Sign in
          </button>
        ) : (
          <span />
        )}
        <p className="text-xs text-muted-foreground sm:text-sm">
          Step {currentStep} of {steps.length}
        </p>
      </div>

      <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <StepPills steps={steps} currentStep={currentStep} onStepClick={onStepClick} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-6"
        >
          <div className="flex justify-center">
            <BadgePill accent={step.accent} active>
              {step.stepLabel}
            </BadgePill>
          </div>

          {isLastStep ? (
            <GoogleSignInForm title={step.title} description={step.description} />
          ) : (
            <>
              <WalkthroughHero icon={step.icon} accent={step.accent} />
              <div className="space-y-3 text-center">
                <h2 className="text-xl font-bold sm:text-2xl md:text-3xl">{step.title}</h2>
                <p className="mx-auto max-w-lg text-sm text-muted-foreground sm:text-base">
                  {step.description}
                </p>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <StepDots total={steps.length} current={currentStep} />

      {!isLastStep && (
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            disabled={currentStep === 1}
            aria-label="Previous step"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button size="lg" className="min-w-[120px] flex-1 rounded-2xl sm:min-w-[140px] sm:flex-none" onClick={onNext}>
            Next
            <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
