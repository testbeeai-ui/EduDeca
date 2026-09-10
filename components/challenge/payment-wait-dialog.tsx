"use client";

import { motion } from "framer-motion";
import { Hourglass } from "lucide-react";

import {
  LEVEL4_WAIT_BODY,
  LEVEL4_WAIT_TITLE,
} from "@/lib/challenge/level4-gate-copy";
import { springSnappy } from "@/lib/motion";

interface PaymentWaitDialogProps {
  open: boolean;
  onClose: () => void;
}

export function PaymentWaitDialog({ open, onClose }: PaymentWaitDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-wait-title"
        initial={{ opacity: 0, y: 16, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={springSnappy}
        className="w-full max-w-sm rounded-[1.75rem] border-2 border-emerald-400/25 bg-slate-950 px-6 py-8 text-center shadow-[0_12px_0_0_rgba(4,120,87,0.35)]"
      >
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border-[3px] border-emerald-300/40 bg-emerald-400 text-slate-950 shadow-[0_5px_0_0_#047857]">
          <Hourglass className="size-6" strokeWidth={2.5} />
        </div>
        <h2 id="payment-wait-title" className="text-2xl font-black tracking-tight text-white">
          {LEVEL4_WAIT_TITLE}
        </h2>
        <p className="mt-3 text-sm font-medium leading-relaxed text-slate-300">{LEVEL4_WAIT_BODY}</p>
        <button
          type="button"
          className="mt-7 w-full rounded-2xl bg-emerald-400 px-5 py-3.5 text-sm font-black text-slate-950 shadow-[0_5px_0_0_#047857] transition hover:brightness-105 active:translate-y-[2px] active:shadow-[0_3px_0_0_#047857]"
          onClick={onClose}
        >
          Got it
        </button>
      </motion.div>
    </div>
  );
}
