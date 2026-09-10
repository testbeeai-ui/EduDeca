"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ComingSoonPanelProps {
  level: number;
  onBack?: () => void;
}

export function ComingSoonPanel({ level, onBack }: ComingSoonPanelProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-amber-500/25 bg-slate-950/85 p-8 text-center shadow-2xl shadow-amber-950/20">
      <div className="flex size-16 items-center justify-center rounded-full border border-amber-400/40 bg-amber-500/15 text-amber-300">
        <Sparkles className="size-7" />
      </div>
      <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Level {level}</p>
      <h2 className="text-3xl font-black text-white">Coming soon</h2>
      <p className="text-sm text-slate-300">
        Questions for this level are being prepared. Check back shortly.
      </p>
      {onBack ? (
        <Button
          type="button"
          variant="outline"
          className="mt-2 w-full border-white/20 bg-white/5 font-bold text-slate-200 hover:bg-white/10"
          onClick={onBack}
        >
          Back to Home
        </Button>
      ) : null}
    </div>
  );
}
