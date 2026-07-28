"use client";

import { LevelTimeline } from "@/components/levels/level-timeline";
import { ProgressHeader } from "@/components/levels/progress-header";
import { TierSummaryCards } from "@/components/levels/tier-summary-cards";
import { levelTiers } from "@/data/levels";
import { getLevelPath } from "@/lib/challenge/get-level-path";
import { useAppStore } from "@/store/useAppStore";

export default function LevelsPage() {
  const campaignLevel = useAppStore((s) => s.campaignLevel);
  const isProctoredPaid = useAppStore((s) => s.isProctoredPaid);
  const freeZoneComplete = useAppStore((s) => s.freeZoneComplete);
  const levels = getLevelPath(campaignLevel, isProctoredPaid, freeZoneComplete);

  return (
    <div className="mx-auto flex max-w-5xl flex-col space-y-6 pb-16">
      <section className="shrink-0 space-y-3">
        <div className="space-y-0.5">
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl text-white">Level Path</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Free play → proctored rounds → national finals
          </p>
        </div>

        <ProgressHeader />
        <TierSummaryCards tiers={levelTiers} />
      </section>

      <section className="pt-2">
        <LevelTimeline levels={levels} />
      </section>
    </div>
  );
}

