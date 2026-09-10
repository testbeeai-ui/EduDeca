"use client";

import { Button } from "@/components/ui/button";

interface ChallengeAccessNoticeProps {
  title: string;
  description: string;
  onBack: () => void;
}

export function ChallengeAccessNotice({
  title,
  description,
  onBack,
}: ChallengeAccessNoticeProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-2xl font-black text-white">{title}</h2>
      <p className="max-w-sm text-sm text-slate-400">{description}</p>
      <Button type="button" variant="outline" onClick={onBack}>
        Back to Home
      </Button>
    </div>
  );
}
