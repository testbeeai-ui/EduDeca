"use client";

import { Check, Copy, Link2, MessageCircle, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type ReferralShareSheetProps = {
  open: boolean;
  onClose: () => void;
  code: string | null;
  shareUrl: string;
};

function inviteMessage(shareUrl: string, code: string | null): string {
  const codeLine = code ? `\nMy code: ${code}` : "";
  return `Hey! Join me on EduDeca — India's National Academic Decathlon. Compete across 10 disciplines and climb the national leaderboard.${codeLine}\n\n${shareUrl}`;
}

export function ReferralShareSheet({
  open,
  onClose,
  code,
  shareUrl,
}: ReferralShareSheetProps) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const copiedVisible = open ? copied : null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const text = inviteMessage(shareUrl, code);
  const encoded = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(shareUrl);

  const flash = (kind: "link" | "code") => {
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      flash("link");
    } catch {
      /* ignore */
    }
  };

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      flash("code");
    } catch {
      /* ignore */
    }
  };

  const shareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank", "noopener,noreferrer");
  };

  const shareTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(inviteMessage("", code).trim())}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const shareMore = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Join me on EduDeca",
          text: inviteMessage("", code).trim(),
          url: shareUrl,
        });
        return;
      } catch {
        /* user cancelled or unsupported — fall through to copy */
      }
    }
    await copyLink();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="referral-share-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-emerald-500/25 bg-[#0b1219] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id="referral-share-title"
              className="text-base font-bold text-white tracking-tight"
            >
              Refer friends
            </h2>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Send your personal invite. When they join EduDeca with your link,
              they show up in your referrals.
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

        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">
            Your invite code
          </p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="font-mono text-sm font-semibold text-emerald-300">
              {code ?? "—"}
            </p>
            <button
              type="button"
              onClick={() => void copyCode()}
              disabled={!code}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-emerald-300/90 hover:bg-emerald-500/10 disabled:opacity-40"
            >
              {copiedVisible === "code" ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copiedVisible === "code" ? "Copied" : "Copy code"}
            </button>
          </div>
          <p className="mt-2 truncate text-[11px] text-slate-500">{shareUrl}</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={shareWhatsApp}
            className="flex items-center gap-2.5 rounded-xl border border-[#25D366]/35 bg-[#25D366]/15 px-3 py-3 text-left transition hover:bg-[#25D366]/25"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-[#25D366] text-white">
              <MessageCircle className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-bold text-white">WhatsApp</span>
              <span className="block text-[10px] text-slate-400">Message friends</span>
            </span>
          </button>

          <button
            type="button"
            onClick={shareTelegram}
            className="flex items-center gap-2.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-3 text-left transition hover:bg-sky-500/20"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-sky-500 text-white text-xs font-bold">
              TG
            </span>
            <span>
              <span className="block text-sm font-bold text-white">Telegram</span>
              <span className="block text-[10px] text-slate-400">Share in chat</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => void copyLink()}
            className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-left transition hover:bg-emerald-500/20"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-emerald-500/30 text-emerald-300">
              {copiedVisible === "link" ? (
                <Check className="size-4" />
              ) : (
                <Link2 className="size-4" />
              )}
            </span>
            <span>
              <span className="block text-sm font-bold text-white">
                {copiedVisible === "link" ? "Link copied!" : "Copy link"}
              </span>
              <span className="block text-[10px] text-slate-400">Paste anywhere</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => void shareMore()}
            className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-left transition hover:bg-white/10"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white">
              <Share2 className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-bold text-white">More</span>
              <span className="block text-[10px] text-slate-400">
                Instagram, SMS, …
              </span>
            </span>
          </button>
        </div>

        <p
          className={cn(
            "mt-4 text-center text-[11px] text-slate-500",
          )}
        >
          Friends must open your link and sign in — that counts as your referral.
        </p>
      </div>
    </div>
  );
}
