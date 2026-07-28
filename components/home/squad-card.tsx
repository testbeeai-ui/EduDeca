import { Rocket, ShieldCheck } from "lucide-react";

import { AvatarStack } from "@/components/common/avatar-stack";
import type { SquadInfo } from "@/lib/types";

interface SquadCardProps {
  squad: SquadInfo;
}

export function SquadCard({ squad }: SquadCardProps) {
  return (
    <div className="glass-card card-top-light rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30">
      <div className="absolute top-0 right-0 size-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
      
      <div className="flex items-start gap-4 relative z-10">
        <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-500/10 shrink-0">
          <Rocket className="size-5" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-white text-base tracking-tight">
                Squad &apos;{squad.name}&apos;
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                <ShieldCheck className="size-3 text-emerald-400" /> #{squad.nationalRank} National
              </span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              {squad.membersActive} members answering daily. {squad.referralPrompt}
            </p>
          </div>
          <AvatarStack members={squad.members} />
        </div>
      </div>
    </div>
  );
}

