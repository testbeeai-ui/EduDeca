"use client";

import { ShieldOff } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ChallengeBlockedProps {
  title: string;
  description: string;
  onBack: () => void;
}

export function ChallengeBlocked({ title, description, onBack }: ChallengeBlockedProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full border border-rose-400/30 bg-rose-500/10 text-rose-300">
        <ShieldOff className="size-7" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-white">{title}</h2>
        <p className="mx-auto max-w-sm text-sm text-slate-400">{description}</p>
      </div>
      <Button type="button" variant="outline" onClick={onBack}>
        Back to Home
      </Button>
    </div>
  );
}
