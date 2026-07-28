"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { MotionFade } from "@/components/common/motion-fade";
import { PageHeader } from "@/components/shell/page-header";
import {
  BadgesRow,
  ReferralRewardCard,
  RewardCard,
  RewardGrid,
  RewardsHero,
} from "@/components/rewards/reward-components";
import { Button } from "@/components/ui/button";
import { prizeCards, userBadges } from "@/data/rewards";
import { currentUser } from "@/data/user";

export default function RewardsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
      <MotionFade>
        <PageHeader
          title="Rewards"
          subtitle="Prizes & Recognition — Physical finals beyond Level 6 can be sponsor-backed."
        />
      </MotionFade>

      <MotionFade delay={0.05}>
        <RewardsHero streakDays={currentUser.streakDays} xp={currentUser.xp} />
      </MotionFade>

      <MotionFade delay={0.1}>
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Prizes & Recognition</h2>
          <RewardGrid>
            {prizeCards.map((prize) => (
              <RewardCard
                key={prize.id}
                title={prize.title}
                subtitle={prize.subtitle}
                icon={prize.icon}
                accent={prize.accent}
              />
            ))}
          </RewardGrid>
        </section>
      </MotionFade>

      <MotionFade delay={0.15}>
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your badges</h2>
            <button type="button" className="text-sm text-primary hover:underline">
              See all
            </button>
          </div>
          <BadgesRow badges={userBadges} />
        </section>
      </MotionFade>

      <MotionFade delay={0.2}>
        <ReferralRewardCard />
      </MotionFade>

      <MotionFade delay={0.25}>
        <Button
          asChild
          size="lg"
          className="h-14 w-full rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 font-extrabold text-white shadow-xl shadow-indigo-500/20 hover:brightness-110 active:scale-[0.99] transition-all"
        >
          <Link href="https://edublast.in" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
            Continue to Edublast.in
            <ArrowRight className="size-5 stroke-[2.5]" />
          </Link>
        </Button>
      </MotionFade>
    </div>
  );
}

