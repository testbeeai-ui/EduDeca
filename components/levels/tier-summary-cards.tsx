"use client";

import { Badge } from "@/components/ui/badge";
import type { LevelTierSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TierSummaryCardsProps {
  tiers: LevelTierSummary[];
}

const tierStyleMap: Record<string, string> = {
  free: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]",
  paid: "border-violet-500/30 bg-violet-500/10 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.15)]",
  finals: "border-rose-500/30 bg-rose-500/10 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.15)]",
};

export function TierSummaryCards({ tiers }: TierSummaryCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {tiers.map((tier) => {
        const theme = tierStyleMap[tier.id] || tierStyleMap.free;

        return (
          <div
            key={tier.id}
            className={cn(
              "rounded-2xl border backdrop-blur-xl px-4 py-3.5 transition-all duration-300 hover:scale-[1.02]",
              theme
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold tracking-tight text-white">{tier.label}</p>
                <p className="mt-1 line-clamp-1 text-xs opacity-90">
                  {tier.description}
                </p>
              </div>
              <Badge
                variant="outline"
                className="shrink-0 border-current/40 bg-white/5 font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5"
              >
                {tier.badge}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}

