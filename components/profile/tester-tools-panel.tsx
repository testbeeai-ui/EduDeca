"use client";

import { FlaskConical, SkipForward } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { isTesterInvestorEmail } from "@/lib/admin/tester-allowlist";
import { postTesterAction } from "@/lib/progress/client";
import { useAppStore } from "@/store/useAppStore";

export function TesterToolsPanel() {
  const router = useRouter();
  const email = useAppStore((s) => s.email);
  const campaignLevel = useAppStore((s) => s.campaignLevel);
  const todayCompleted = useAppStore((s) => s.todayCompleted);
  const skipDailyWait = useAppStore((s) => s.skipDailyWait);
  const jumpToCampaignLevel = useAppStore((s) => s.jumpToCampaignLevel);
  const hydrateProgress = useAppStore((s) => s.hydrateProgress);
  const [busy, setBusy] = useState(false);

  if (!isTesterInvestorEmail(email)) return null;

  const runSkip = async () => {
    setBusy(true);
    skipDailyWait();
    const progress = await postTesterAction({ action: "skip_wait" });
    if (progress) hydrateProgress(progress);
    setBusy(false);
    router.push("/challenge");
  };

  const runJump = async (level: 1 | 2 | 3) => {
    setBusy(true);
    jumpToCampaignLevel(level);
    const progress = await postTesterAction({ action: "jump_level", level });
    if (progress) hydrateProgress(progress);
    setBusy(false);
  };

  return (
    <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex items-center gap-2 text-amber-200">
        <FlaskConical className="size-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">
          Tester / Investor tools
        </span>
      </div>
      <p className="text-xs leading-relaxed text-amber-100/70">
        Skip the daily wait and jump free-zone levels for demos. Synced to Supabase. Current: Level{" "}
        {campaignLevel}
        {todayCompleted ? " · locked until tomorrow" : ""}.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          className="border-amber-400/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
          onClick={() => void runSkip()}
        >
          <SkipForward className="size-3.5" />
          Skip wait &amp; play
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          className="border-amber-400/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
          onClick={() => void runJump(1)}
        >
          Go Level 1
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          className="border-amber-400/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
          onClick={() => void runJump(2)}
        >
          Go Level 2
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          className="border-amber-400/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
          onClick={() => void runJump(3)}
        >
          Go Level 3
        </Button>
      </div>
    </div>
  );
}
