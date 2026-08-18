"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

import { BadgePill } from "@/components/common/badge-pill";
import { DisciplinePicker } from "@/components/signin/discipline-picker";
import { GoogleSignInForm } from "@/components/signin/google-sign-in";
import { StepDots, StepPills } from "@/components/signin/step-pills";
import { WalkthroughHero } from "@/components/signin/walkthrough-hero";
import { Button } from "@/components/ui/button";
import {
  WALKTHROUGH_DISCIPLINES_STEP,
  WALKTHROUGH_SIGN_IN_STEP,
} from "@/data/walkthrough";
import { isLineupComplete } from "@/lib/disciplines/selection";
import {
  EDUDECA_PENDING_REFERRER_KEY,
  displayReferrerName,
} from "@/lib/referral/referral-code";
import type { WalkthroughStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

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
  const isLastStep = currentStep === WALKTHROUGH_SIGN_IN_STEP;
  const isDisciplinesStep = currentStep === WALKTHROUGH_DISCIPLINES_STEP;
  const disciplineLineup = useAppStore((s) => s.disciplineLineup);
  const setDisciplineLineup = useAppStore((s) => s.setDisciplineLineup);
  const setWalkthroughStep = useAppStore((s) => s.setWalkthroughStep);
  const lineupReady = isLineupComplete(disciplineLineup);
  const [gateHint, setGateHint] = useState<string | null>(null);

  // Google is step 7 — never allow it until the Decathlon lineup is complete.
  useEffect(() => {
    if (currentStep === WALKTHROUGH_SIGN_IN_STEP && !lineupReady) {
      setWalkthroughStep(WALKTHROUGH_DISCIPLINES_STEP);
      setGateHint("Pick your 10 disciplines before continuing with Google.");
    }
  }, [currentStep, lineupReady, setWalkthroughStep]);

  useEffect(() => {
    if (lineupReady) setGateHint(null);
  }, [lineupReady]);

  if (!step) return null;

  const goSignInOnlyIfReady = () => {
    if (!lineupReady) {
      setWalkthroughStep(WALKTHROUGH_DISCIPLINES_STEP);
      setGateHint("Pick your 10 disciplines before continuing with Google.");
      return;
    }
    onSkipToSignIn();
  };

  const handleStepClick = (stepId: number) => {
    if (stepId === WALKTHROUGH_SIGN_IN_STEP && !lineupReady) {
      setWalkthroughStep(WALKTHROUGH_DISCIPLINES_STEP);
      setGateHint("Pick your 10 disciplines before continuing with Google.");
      return;
    }
    onStepClick(stepId);
  };

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col",
        isDisciplinesStep ? "max-w-6xl gap-2.5" : "max-w-2xl gap-6 sm:gap-8",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        {!isLastStep ? (
          <button
            type="button"
            onClick={goSignInOnlyIfReady}
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

      <ReferralInviteBanner />

      {gateHint ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs font-medium text-amber-200">
          {gateHint}
        </p>
      ) : null}

      <div className="overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <StepPills steps={steps} currentStep={currentStep} onStepClick={handleStepClick} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className={cn(isDisciplinesStep ? "space-y-0" : "space-y-6")}
        >
          {!isDisciplinesStep && !isLastStep ? (
            <div className="flex justify-center">
              <BadgePill accent={step.accent} active>
                {step.stepLabel}
              </BadgePill>
            </div>
          ) : null}

          {isLastStep && lineupReady ? (
            <GoogleSignInForm title={step.title} description={step.description} />
          ) : isDisciplinesStep || (isLastStep && !lineupReady) ? (
            <DisciplinePicker
              lineup={disciplineLineup}
              onChange={setDisciplineLineup}
              onContinue={onNext}
              onBack={onBack}
            />
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

      {!isDisciplinesStep && !(isLastStep && !lineupReady) ? (
        <StepDots total={steps.length} current={currentStep} />
      ) : null}

      {!isLastStep && !isDisciplinesStep && (
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
          <Button
            size="lg"
            className="min-w-[120px] flex-1 rounded-2xl sm:min-w-[140px] sm:flex-none"
            onClick={onNext}
          >
            Next
            <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function ReferralInviteBanner() {
  const [name, setName] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(EDUDECA_PENDING_REFERRER_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (name) return;
    void fetch("/api/referral/pending", { credentials: "include" })
      .then((r) => r.json() as Promise<{ name?: string | null }>)
      .then((payload) => {
        if (!payload.name) return;
        const next = displayReferrerName(payload.name);
        try {
          sessionStorage.setItem(EDUDECA_PENDING_REFERRER_KEY, next);
        } catch {
          /* ignore */
        }
        setName(next);
      })
      .catch(() => undefined);
  }, [name]);

  if (!name) return null;

  return (
    <p className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-center text-sm">
      You&apos;re joining as a referral of{" "}
      <span className="font-semibold text-primary">{name}</span>
    </p>
  );
}
