"use client";

import { MessageCircle, Rocket, Share2, ShieldCheck, Users } from "lucide-react";
import { useCallback, useState } from "react";

import { AvatarStack } from "@/components/common/avatar-stack";
import {
  ReferralListDialog,
  type ReferralMinePayload,
} from "@/components/home/referral-list-dialog";
import { ReferralShareSheet } from "@/components/home/referral-share-sheet";
import { squadInfo, WHATSAPP_COMMUNITY_URL } from "@/data/squad";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

/**
 * Squad card: official WhatsApp community join + referral list.
 */
export function SquadCard() {
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  const [data, setData] = useState<ReferralMinePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const load = useCallback(async () => {
    if (!isSignedIn) {
      setData(null);
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
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

  const referred =
    data?.entries.map((e) => ({
      id: e.id,
      initials: e.initials,
      avatarColor: e.avatarColor,
    })) ?? [];
  const members = referred.length > 0 ? referred : squadInfo.members;
  const memberCount =
    referred.length > 0 ? (data?.count ?? referred.length) : squadInfo.membersActive;

  const openShare = () => {
    if (!isSignedIn) return;
    void load().then(() => setShareOpen(true));
  };

  const openList = () => {
    if (!isSignedIn) return;
    void load().then(() => setListOpen(true));
  };

  return (
    <>
      <div className="glass-card card-top-light rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30 w-full">
        <div className="absolute top-0 right-0 size-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-start gap-4 relative z-10">
          <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-500/10 shrink-0">
            <Rocket className="size-5" />
          </div>
          <div className="flex-1 space-y-3 min-w-0">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-white text-base tracking-tight">
                  Squad &lsquo;{squadInfo.name}&rsquo;
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                  <ShieldCheck className="size-3 text-emerald-400" />
                  #{squadInfo.nationalRank} National
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                {memberCount} members answering daily. {squadInfo.referralPrompt}
              </p>
            </div>

            {members.length > 0 ? <AvatarStack members={members} /> : null}

            <div className="flex flex-wrap gap-2 pt-0.5">
              <a
                href={WHATSAPP_COMMUNITY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3.5 py-2 text-xs font-extrabold text-[#04140b] shadow-lg shadow-emerald-500/20 transition hover:brightness-110"
              >
                <MessageCircle className="size-3.5" />
                Join WhatsApp community
              </a>
              <button
                type="button"
                onClick={openShare}
                disabled={!isSignedIn}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-2 text-xs font-extrabold text-[#04120e] shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none"
              >
                <Share2 className="size-3.5" />
                Refer now
              </button>
              <button
                type="button"
                onClick={openList}
                disabled={!isSignedIn}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none"
              >
                <Users className="size-3.5" />
                Who joined
              </button>
            </div>
          </div>
        </div>
      </div>

      <ReferralShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        code={data?.code ?? null}
        shareUrl={data?.shareUrl ?? ""}
      />

      <ReferralListDialog
        open={listOpen}
        onClose={() => setListOpen(false)}
        data={data}
        loading={loading && !data}
        onReferAgain={() => {
          setListOpen(false);
          setShareOpen(true);
        }}
      />
    </>
  );
}
