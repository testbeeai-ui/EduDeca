import { Megaphone, Share2 } from "lucide-react";

export function ReferralCard() {
  return (
    <div className="glass-card card-top-light rounded-2xl p-5 relative overflow-hidden border-amber-500/25 bg-gradient-to-r from-amber-500/10 via-card/80 to-amber-500/5 shadow-xl">
      <div className="flex items-start gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/20 shrink-0">
          <Megaphone className="size-6 text-amber-400" />
        </div>
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-base tracking-tight">Referral Virality Engine</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
              <Share2 className="size-3 text-amber-400" /> +500 XP / Referral
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Every friend you bring in adds XP to both your profile and your college&apos;s total — the leaderboard is the growth engine.
          </p>
        </div>
      </div>
    </div>
  );
}

