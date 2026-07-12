"use client";

import { accentClasses } from "@/components/common/glass-card";
import { Badge } from "@/components/ui/badge";
import type { LevelTierSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TierSummaryCardsProps {
  tiers: LevelTierSummary[];
}

export function TierSummaryCards({ tiers }: TierSummaryCardsProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
      {tiers.map((tier) => (
        <div
          key={tier.id}
          className={cn(
            "rounded-xl border border-border/60 bg-transparent px-3 py-2.5",
            accentClasses(tier.accent)
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold sm:text-sm">{tier.label}</p>
              <p className="mt-0.5 line-clamp-1 text-[11px] opacity-80 sm:text-xs">
                {tier.description}
              </p>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 border-current/30 bg-transparent px-1.5 py-0 text-[10px]"
            >
              {tier.badge}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
