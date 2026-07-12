"use client";

import { WalkthroughStepCard } from "@/components/signin/walkthrough-step-card";
import { MotionFade } from "@/components/common/motion-fade";
import { walkthroughSteps } from "@/data/walkthrough";
import { useAppStore } from "@/store/useAppStore";

export default function SignInPage() {
  const currentStep = useAppStore((s) => s.walkthroughStep);
  const setWalkthroughStep = useAppStore((s) => s.setWalkthroughStep);
  const nextWalkthroughStep = useAppStore((s) => s.nextWalkthroughStep);
  const prevWalkthroughStep = useAppStore((s) => s.prevWalkthroughStep);

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
