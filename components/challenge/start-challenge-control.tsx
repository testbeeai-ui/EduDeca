"use client";

import Link from "next/link";
import { Clock, Lock } from "lucide-react";

import { useLevelTrials } from "@/hooks/use-level-trials";
import { useQuestionAvailability } from "@/hooks/use-question-availability";
import { isTesterInvestorEmail } from "@/lib/admin/tester-allowlist";
import { isLevelReady } from "@/lib/challenge/availability";
import {
  LEVEL4_HOME_CTA,
  shouldShowLevel4UnlockCta,
} from "@/lib/challenge/level4-gate-copy";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

interface StartChallengeControlProps {
  className?: string;
  comingSoonClassName?: string;
  label?: string;
}

export function StartChallengeControl({
  className,
  comingSoonClassName,
  label,
}: StartChallengeControlProps) {
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  const email = useAppStore((s) => s.email);
  const campaignLevel = useAppStore((s) => s.campaignLevel);
  const availability = useQuestionAvailability();
  const { trials } = useLevelTrials(isSignedIn && !isTesterInvestorEmail(email));
  const ready = isLevelReady(availability, campaignLevel);
  const href = isSignedIn ? "/challenge" : "/signin";
  const text = label ?? `Start Level ${campaignLevel} Challenge →`;
  const exhausted = isSignedIn && trials?.gate === "trials_exhausted";
  const level4Unlock = isSignedIn && shouldShowLevel4UnlockCta(campaignLevel);

  if (level4Unlock) {
    return (
      <Link
        href={href}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-400/40 bg-violet-500/10 px-6 py-3 font-extrabold text-violet-100 transition hover:bg-violet-500/20",
          comingSoonClassName,
          className,
        )}
      >
        <Lock className="size-4 shrink-0" />
        {LEVEL4_HOME_CTA}
      </Link>
    );
  }

  if (isSignedIn && ready === false) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-6 py-3 font-extrabold text-amber-200",
          comingSoonClassName,
        )}
        role="status"
      >
        <Clock className="size-4 shrink-0" />
        Coming soon · Level {campaignLevel}
      </div>
    );
  }

  if (exhausted) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-6 py-3 font-extrabold text-rose-200",
          comingSoonClassName,
        )}
        role="status"
      >
        No attempts left · Level {campaignLevel}
      </div>
    );
  }

  return (
    <Link href={href} className={className}>
      {text}
    </Link>
  );
}
