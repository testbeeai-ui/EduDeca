"use client";

import { ChallengeCTA } from "@/components/home/challenge-cta";
import { LeaderboardPreview } from "@/components/home/leaderboard-preview";
import { LevelStatusCard } from "@/components/home/level-status-card";
import { SquadCard } from "@/components/home/squad-card";
import { SubjectGrid } from "@/components/home/subject-grid";
import { MotionFade } from "@/components/common/motion-fade";
import { leaderboardPreview } from "@/data/leaderboard";
import { squadInfo } from "@/data/squad";
import { currentUser } from "@/data/user";
import { firstNameFrom } from "@/lib/utils";
import { useAppStore, useProgressUser, useSubjectsWithProgress } from "@/store/useAppStore";

export default function HomePage() {
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  const userName = useAppStore((s) => s.userName);
  const streakDays = useAppStore((s) => s.streakDays);
  const progress = useProgressUser();
  const subjects = useSubjectsWithProgress();

  const greetingName = isSignedIn && userName ? firstNameFrom(userName) : "Student";
  const greetingSubtitle = isSignedIn
    ? `Day ${streakDays} streak — your journey starts here. Play today to keep it alive.`
    : "Your daily learning journey starts here. Start today's challenge to begin.";

  const user = {
    ...currentUser,
    level: progress.level,
    xp: progress.xp,
    streakDays,
    zone: progress.zone,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
      <MotionFade>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold sm:text-3xl">Hey {greetingName} 👋</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {greetingSubtitle}
          </p>
        </div>
      </MotionFade>

      <div className="grid gap-5 lg:gap-6 xl:grid-cols-[1fr_300px]">
        <div className="space-y-5 sm:space-y-6">
          <MotionFade delay={0.05}>
            <LevelStatusCard user={user} />
          </MotionFade>

          <MotionFade delay={0.1}>
            <ChallengeCTA />
          </MotionFade>

          <MotionFade delay={0.15}>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold sm:text-lg">Your 10 disciplines</h2>
                <button type="button" className="shrink-0 text-sm text-primary hover:underline">
                  See all
                </button>
              </div>
              <SubjectGrid subjects={subjects} />
            </div>
          </MotionFade>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 xl:space-y-0">
          <MotionFade delay={0.1}>
            <SquadCard squad={squadInfo} />
          </MotionFade>
          <MotionFade delay={0.15}>
            <LeaderboardPreview entries={leaderboardPreview} />
          </MotionFade>
        </div>
      </div>
    </div>
  );
}
