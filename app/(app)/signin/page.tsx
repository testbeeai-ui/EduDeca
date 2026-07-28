"use client";

import { Suspense } from "react";

import { MotionFade } from "@/components/common/motion-fade";
import { WalkthroughStepCard } from "@/components/signin/walkthrough-step-card";
import { walkthroughSteps } from "@/data/walkthrough";
import { useAppStore } from "@/store/useAppStore";

function SignInContent() {
  const currentStep = useAppStore((s) => s.walkthroughStep);
  const nextWalkthroughStep = useAppStore((s) => s.nextWalkthroughStep);
  const prevWalkthroughStep = useAppStore((s) => s.prevWalkthroughStep);
  const setWalkthroughStep = useAppStore((s) => s.setWalkthroughStep);

  return (
    <MotionFade className="w-full">
      <WalkthroughStepCard
        steps={walkthroughSteps}
        currentStep={currentStep}
        onNext={nextWalkthroughStep}
        onBack={prevWalkthroughStep}
        onStepClick={setWalkthroughStep}
        onSkipToSignIn={() => setWalkthroughStep(6)}
      />
    </MotionFade>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
