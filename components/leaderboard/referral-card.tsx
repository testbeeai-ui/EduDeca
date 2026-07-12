import { Megaphone } from "lucide-react";

import { GlassCard } from "@/components/common/glass-card";

export function ReferralCard() {
  return (
    <GlassCard>
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-level-amber/10 text-level-amber">
          <Megaphone className="size-5" />
        </div>
        <div>
          <h3 className="font-semibold">Referral virality</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Every friend you bring in adds XP to both your profile and your college&apos;s total — the
            leaderboard is the growth engine.
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
