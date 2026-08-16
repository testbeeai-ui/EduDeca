"use client";

import { Rocket, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AvatarStack } from "@/components/common/avatar-stack";
import {
  ReferralListDialog,
  type ReferralMinePayload,
} from "@/components/home/referral-list-dialog";
import { useAppStore } from "@/store/useAppStore";

/**
 * Live referral card: count + avatars of people who joined via this user's ED- code.
 * Click opens the full list popup (investor ask).
 */
export function SquadCard() {
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  const [data, setData] = useState<ReferralMinePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!isSignedIn) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/referral/mine", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        setData(null);
        return;
      }
      const json = (await res.json()) as ReferralMinePayload;
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    void load();
  }, [load]);

  const count = data?.count ?? 0;
  const members =
    data?.entries.map((e) => ({
      id: e.id,
      initials: e.initials,
      avatarColor: e.avatarColor,
    })) ?? [];

  const prompt =
    count === 0
      ? "Share your invite link so friends can join EduDeca."
      : "Tap to see everyone who joined with your code.";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!isSignedIn) return;
          setOpen(true);
          void load();
        }}
        className="glass-card card-top-light rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30 text-left w-full disabled:opacity-70"
        disabled={!isSignedIn}
        aria-label="Open your referral list"
      >
        <div className="absolute top-0 right-0 size-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-start gap-4 relative z-10">
          <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-500/10 shrink-0">
            <Rocket className="size-5" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-white text-base tracking-tight">
                  Your referrals
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                  <ShieldCheck className="size-3 text-emerald-400" />
                  {loading ? "…" : `${count} joined`}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                {isSignedIn
                  ? prompt
                  : "Sign in to get your ED- invite code and track who joins."}
              </p>
              {data?.code ? (
                <p className="mt-1 font-mono text-[11px] text-emerald-400/90">
                  {data.code}
                </p>
              ) : null}
            </div>
            {members.length > 0 ? <AvatarStack members={members} /> : null}
          </div>
        </div>
      </button>

      <ReferralListDialog
        open={open}
        onClose={() => setOpen(false)}
        data={data}
        loading={loading && !data}
      />
    </>
  );
}
