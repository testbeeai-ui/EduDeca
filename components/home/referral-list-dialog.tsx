"use client";

import { Copy, Users, X } from "lucide-react";
import { useEffect, useState } from "react";

import { AvatarStack } from "@/components/common/avatar-stack";
import { cn } from "@/lib/utils";

export type ReferralMineEntry = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  creditedAt: string;
};

export type ReferralMinePayload = {
  code: string | null;
  shareUrl: string;
  count: number;
  entries: ReferralMineEntry[];
};

type ReferralListDialogProps = {
  open: boolean;
  onClose: () => void;
  data: ReferralMinePayload | null;
  loading?: boolean;
};

export function ReferralListDialog({
  open,
  onClose,
  data,
  loading,
}: ReferralListDialogProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const copyLink = async () => {
    if (!data?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(data.shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="referral-dialog-title"
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-md rounded-2xl border border-emerald-500/25 bg-[#0b1219] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id="referral-dialog-title"
              className="text-base font-bold text-white tracking-tight"
            >
              Your referrals
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              People who joined EduDeca with your invite link.
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">
                Your code
              </p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-emerald-300">
                {data?.code ?? "—"}
              </p>
              <button
                type="button"
                onClick={() => void copyLink()}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
              >
                <Copy className="size-3.5" />
                {copied ? "Copied!" : "Copy invite link"}
              </button>
            </div>

            <div className="mb-3 flex items-center gap-2 text-sm text-slate-300">
              <Users className="size-4 text-emerald-400" />
              <span>
                <strong className="text-white">{data?.count ?? 0}</strong> joined
              </span>
            </div>

            {(data?.entries.length ?? 0) === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-muted-foreground">
                No one has joined with your link yet. Share it on WhatsApp to grow
                your list.
              </p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {data!.entries.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2"
                  >
                    <div
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full text-xs font-bold text-white",
                        entry.avatarColor,
                      )}
                    >
                      {entry.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {entry.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Joined{" "}
                        {new Date(entry.creditedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {(data?.entries.length ?? 0) > 0 ? (
              <div className="mt-4">
                <AvatarStack
                  members={data!.entries.map((e) => ({
                    id: e.id,
                    initials: e.initials,
                    avatarColor: e.avatarColor,
                  }))}
                  max={6}
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
