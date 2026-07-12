import { Rocket } from "lucide-react";

import { AvatarStack } from "@/components/common/avatar-stack";
import { GlassCard } from "@/components/common/glass-card";
import type { SquadInfo } from "@/lib/types";

interface SquadCardProps {
  squad: SquadInfo;
}

export function SquadCard({ squad }: SquadCardProps) {
  return (
    <GlassCard hover>
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Rocket className="size-5" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <p className="font-semibold">
              Squad &apos;{squad.name}&apos; is #{squad.nationalRank} nationally
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {squad.membersActive} members answering daily. {squad.referralPrompt}
            </p>
          </div>
          <AvatarStack members={squad.members} />
        </div>
      </div>
    </GlassCard>
  );
}
