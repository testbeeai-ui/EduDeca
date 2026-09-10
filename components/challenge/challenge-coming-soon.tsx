"use client";

import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ChallengeComingSoonProps {
  level: number;
  onBack: () => void;
}

export function ChallengeComingSoon({ level, onBack }: ChallengeComingSoonProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/10 text-amber-300">
        <Clock className="size-7" />
      </div>
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
          Level {level}
        </p>
        <h2 className="text-2xl font-black text-white">Coming soon</h2>
        <p className="mx-auto max-w-sm text-sm text-slate-400">
          Questions for this level are not live yet. Check back shortly.
        </p>
      </div>
      <Button type="button" variant="outline" onClick={onBack}>
        Back to Home
      </Button>
    </div>
  );
}
