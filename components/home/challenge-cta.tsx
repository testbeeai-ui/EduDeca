"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Timer, Zap } from "lucide-react";
import Link from "next/link";

import {
  formatCountdown,
  msUntilNextIstMidnight,
} from "@/lib/challenge/ist-day";
import { isTesterInvestorEmail } from "@/lib/admin/tester-allowlist";
import { springSnappy } from "@/lib/motion";
import { postTesterAction } from "@/lib/progress/client";
import { useAppStore } from "@/store/useAppStore";

interface ChallengeCTAProps {
  className?: string;
}

function useNextChallengeCountdown(enabled: boolean) {
  const [msLeft, setMsLeft] = useState(() => (enabled ? msUntilNextIstMidnight() : 0));

  useEffect(() => {
    if (!enabled) return;
    setMsLeft(msUntilNextIstMidnight());
    const id = window.setInterval(() => {
      setMsLeft(msUntilNextIstMidnight());
    }, 1000);
    return () => window.clearInterval(id);
  }, [enabled]);

  return msLeft;
}

export function ChallengeCTA({ className }: ChallengeCTAProps) {
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  const email = useAppStore((s) => s.email);
  const campaignLevel = useAppStore((s) => s.campaignLevel);
  const isProctoredPaid = useAppStore((s) => s.isProctoredPaid);
  const todayCompleted = useAppStore((s) => s.todayCompleted);
  const skipDailyWait = useAppStore((s) => s.skipDailyWait);
  const hydrateProgress = useAppStore((s) => s.hydrateProgress);

  const isTester = isTesterInvestorEmail(email);
  const blocked = campaignLevel >= 4 && !isProctoredPaid;
  // Normal users: show countdown until tomorrow. Testers still see it, but can skip.
  const showCompleted = isSignedIn && todayCompleted && !blocked && !isTester;
  const showTesterLocked = isSignedIn && todayCompleted && !blocked && isTester;
  const msLeft = useNextChallengeCountdown(showCompleted || showTesterLocked);
  const challengeHref = isSignedIn ? "/challenge" : "/signin";

  if (showCompleted) {
    return (
      <div className="flex h-14 w-full items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 text-emerald-300 font-bold shadow-lg shadow-emerald-500/5 sm:px-5">
        <span className="inline-flex min-w-0 items-center gap-2.5">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
          <span className="truncate">Completed Today</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-emerald-200 sm:text-xs">
          <Timer className="size-3.5 shrink-0 text-emerald-400" />
          <span className="hidden sm:inline">Level {campaignLevel} in</span>
          <span className="sm:hidden">L{campaignLevel}</span>
          <span className="font-mono tracking-tight">{formatCountdown(msLeft)}</span>
        </span>
      </div>
    );
  }

  const label = blocked
    ? "Unlock Proctored Round"
    : showTesterLocked
      ? `Play Level ${campaignLevel} now (tester)`
      : `Start Level ${campaignLevel} Challenge`;

  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={springSnappy}
    >
      <Link
        href={challengeHref}
        onClick={() => {
          if (showTesterLocked) {
            skipDailyWait();
            void postTesterAction({ action: "skip_wait" }).then((progress) => {
              if (progress) hydrateProgress(progress);
            });
          }
        }}
        className="relative group flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 font-extrabold text-white shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:brightness-110 active:scale-[0.99]"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />

        <Zap className="size-5 fill-white text-white shrink-0" />
        <span className="text-base font-extrabold tracking-tight sm:text-lg text-white">{label}</span>

        <motion.span
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="inline-flex shrink-0"
        >
          <ArrowRight className="size-5 stroke-[2.5] text-white" />
        </motion.span>
      </Link>

      {showTesterLocked ? (
        <p className="mt-2 text-center text-[11px] text-amber-200/80">
          Normal unlock: Level {campaignLevel} in {formatCountdown(msLeft)} · admin skip active
        </p>
      ) : null}
    </motion.div>
  );
}
