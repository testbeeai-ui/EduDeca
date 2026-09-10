"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

import { PaymentWaitDialog } from "@/components/challenge/payment-wait-dialog";
import {
  LEVEL4_ADMIN_PREVIEW,
  LEVEL4_GATE_BODY,
  LEVEL4_GATE_EYEBROW,
  LEVEL4_GATE_SUBTITLE,
  LEVEL4_GATE_TITLE,
  LEVEL4_PAY_CTA,
  LEVEL4_PERKS,
} from "@/lib/challenge/level4-gate-copy";
import { springSnappy } from "@/lib/motion";

interface Level4GateProps {
  onBack: () => void;
  isAdmin?: boolean;
  bankReady?: boolean | null;
  onAdminPreview?: () => void;
}

export function Level4Gate({
  onBack,
  isAdmin = false,
  bankReady = false,
  onAdminPreview,
}: Level4GateProps) {
  const [waitOpen, setWaitOpen] = useState(false);
  const previewEnabled = isAdmin && bankReady === true && Boolean(onAdminPreview);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(16,185,129,0.28),transparent_58%),radial-gradient(ellipse_50%_45%_at_100%_80%,rgba(6,182,212,0.14),transparent_55%),radial-gradient(ellipse_40%_35%_at_0%_70%,rgba(52,211,153,0.1),transparent_50%)]"
        aria-hidden
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-[12%] top-[18%] size-24 rounded-[28px] bg-emerald-400/15"
        animate={{ y: [0, -10, 0], rotate: [0, 4, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-[10%] top-[28%] size-16 rounded-[22px] bg-cyan-400/15"
        animate={{ y: [0, 12, 0], rotate: [0, -6, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-[16%] left-[18%] size-12 rounded-2xl bg-teal-300/10"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-5 py-8 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSnappy}
          className="flex w-full max-w-[22rem] flex-col items-center text-center sm:max-w-md"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.05 }}
            className="relative mb-5"
          >
            <div className="relative flex size-[6.25rem] items-center justify-center rounded-[2rem] border-[3px] border-emerald-300/40 bg-gradient-to-b from-emerald-400 to-teal-500 text-slate-950 shadow-[0_10px_0_0_rgba(4,120,87,0.85)]">
              <span className="text-5xl font-black tracking-tight">4</span>
              <span className="absolute -right-2 -top-2 flex size-9 items-center justify-center rounded-2xl border-2 border-emerald-200/50 bg-cyan-400 text-slate-950 shadow-[0_4px_0_0_rgba(8,145,178,0.9)]">
                <Sparkles className="size-4" strokeWidth={2.5} />
              </span>
            </div>
          </motion.div>

          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, ...springSnappy }}
            className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-300"
          >
            {LEVEL4_GATE_EYEBROW}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, ...springSnappy }}
            className="mt-4 text-[2.15rem] font-black leading-[1.05] tracking-tight text-white sm:text-5xl"
          >
            {LEVEL4_GATE_TITLE}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ...springSnappy }}
            className="mt-2 text-base font-bold text-emerald-200/90 sm:text-lg"
          >
            {LEVEL4_GATE_SUBTITLE}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, ...springSnappy }}
            className="mt-3 max-w-sm text-[15px] font-medium leading-relaxed text-slate-300/90"
          >
            {LEVEL4_GATE_BODY}
          </motion.p>

          <motion.ul
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ...springSnappy }}
            className="mt-7 w-full space-y-2.5 text-left"
          >
            {LEVEL4_PERKS.map((perk, i) => (
              <li
                key={perk}
                className="flex items-center gap-3 rounded-2xl border-2 border-white/10 bg-white/[0.04] px-3.5 py-3"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-400 text-slate-950 shadow-[0_3px_0_0_rgba(4,120,87,0.9)]">
                  <Check className="size-4" strokeWidth={3} />
                </span>
                <span className="text-sm font-bold leading-snug text-slate-100">{perk}</span>
                <span className="ml-auto text-[10px] font-black tabular-nums text-emerald-400/70">
                  0{i + 1}
                </span>
              </li>
            ))}
          </motion.ul>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, ...springSnappy }}
            className="mt-8 w-full space-y-3"
          >
            <button
              type="button"
              onClick={() => setWaitOpen(true)}
              className="group relative w-full rounded-2xl border-0 bg-emerald-400 px-5 py-4 text-base font-black tracking-tight text-slate-950 shadow-[0_6px_0_0_#047857] transition hover:brightness-105 active:translate-y-[3px] active:shadow-[0_3px_0_0_#047857]"
            >
              {LEVEL4_PAY_CTA}
            </button>
            {previewEnabled ? (
              <button
                type="button"
                onClick={onAdminPreview}
                className="w-full rounded-2xl border-2 border-white/15 bg-transparent px-5 py-3 text-sm font-extrabold text-slate-200 transition hover:bg-white/5 active:scale-[0.99]"
              >
                {LEVEL4_ADMIN_PREVIEW}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onBack}
              className="w-full rounded-2xl border-2 border-slate-500/70 bg-slate-900/70 px-5 py-3.5 text-base font-black tracking-tight text-slate-200 shadow-[0_5px_0_0_#334155] transition hover:border-slate-400 hover:bg-slate-800/80 active:translate-y-[3px] active:shadow-[0_2px_0_0_#334155]"
            >
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      </div>

      <PaymentWaitDialog open={waitOpen} onClose={() => setWaitOpen(false)} />
    </div>
  );
}
