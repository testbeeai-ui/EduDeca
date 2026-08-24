"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Trophy } from "lucide-react";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const isNewAccountNotice = searchParams.get("auth_notice") === "new_account";
  const step = steps[currentStep - 1];
  const isLastStep = currentStep === WALKTHROUGH_SIGN_IN_STEP;
  const isDisciplinesStep = currentStep === WALKTHROUGH_DISCIPLINES_STEP;
  const disciplineLineup = useAppStore((s) => s.disciplineLineup);
  const setDisciplineLineup = useAppStore((s) => s.setDisciplineLineup);
  const setWalkthroughStep = useAppStore((s) => s.setWalkthroughStep);
  const lineupReady = isLineupComplete(disciplineLineup);
  const [gateHint, setGateHint] = useState<string | null>(null);

  // Google is step 7 — never allow it until the Decathlon lineup is complete.
  const blockedOnSignIn =
    currentStep === WALKTHROUGH_SIGN_IN_STEP && !lineupReady;
  const derivedGateHint = blockedOnSignIn
    ? "Pick your 10 disciplines before continuing with Google."
    : lineupReady
      ? null
      : gateHint;

  useEffect(() => {
    if (!blockedOnSignIn) return;
    setWalkthroughStep(WALKTHROUGH_DISCIPLINES_STEP);
  }, [blockedOnSignIn, setWalkthroughStep]);

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
        "mx-auto flex w-full min-w-0 flex-col",
        isDisciplinesStep ? "max-w-6xl gap-3 sm:gap-3.5" : "max-w-2xl gap-6 sm:gap-8",
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

      {isNewAccountNotice ? (
        <div
          role="status"
          className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-100/95"
        >
          <p className="font-semibold text-amber-50">Complete Sign-in carefully</p>
          <p className="mt-1 text-amber-100/80">
            This Google account is new to EduDeca. Work through each step — disciplines,
            class, college, and location — so your profile is set correctly the first time.
          </p>
        </div>
      ) : null}

      {derivedGateHint ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs font-medium text-amber-200">
          {derivedGateHint}
        </p>
      ) : null}

      <StepPills steps={steps} currentStep={currentStep} onStepClick={handleStepClick} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className={cn(isDisciplinesStep ? "space-y-0" : "space-y-6")}
        >
          {!isDisciplinesStep ? (
            <div className="flex justify-center">
              <BadgePill accent={step.accent} active>
                {step.stepLabel}
              </BadgePill>
            </div>
          ) : null}

          {isLastStep && lineupReady ? (
            <div className="space-y-6">
              <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-2 text-center text-sm sm:text-base">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-amber-400/80 bg-amber-500/10">
                  <Trophy className="size-3.5 text-amber-400" strokeWidth={2} />
                </span>
                <span className="leading-snug text-amber-400">
                  Continue your journey to become a chosen{" "}
                  <span className="font-bold text-white">Whiz360</span>
                </span>
              </p>
              <GoogleSignInForm title={step.title} description={step.description} />
            </div>
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
