"use client";

import { useEffect } from "react";
import {
  ArrowLeft,
  Atom,
  Dna,
  Microscope,
  Ruler,
  Sigma,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  DISCIPLINES,
  DISCIPLINE_SLOTS,
  LINEUP_SIZE,
  type DisciplineDef,
  type DisciplineId,
} from "@/data/disciplines";
import {
  filledCount,
  isLineupComplete,
  lockEntrepreneurshipSlot,
  selectTrackOption,
  type DisciplineLineup,
} from "@/lib/disciplines/selection";
import { cn } from "@/lib/utils";

type ChipTone = "teal" | "amber" | "purple" | "gold" | "pink";

const CHIP_TONE: Record<ChipTone, { border: string; text: string; num: string }> = {
  teal: {
    border: "border-[rgba(29,158,117,0.6)]",
    text: "text-[#EAFBF4]",
    num: "bg-[#1D9E75]",
  },
  amber: {
    border: "border-[rgba(239,159,39,0.65)]",
    text: "text-[#FFF3E0]",
    num: "bg-[#EF9F27]",
  },
  purple: {
    border: "border-[rgba(127,119,221,0.65)]",
    text: "text-[#F1F0FD]",
    num: "bg-[#7F77DD]",
  },
  gold: {
    border: "border-[rgba(240,180,41,0.65)]",
    text: "text-[#FFF8E1]",
    num: "bg-[#F0B429]",
  },
  pink: {
    border: "border-[rgba(232,93,138,0.65)]",
    text: "text-[#FFEFF4]",
    num: "bg-[#E85D8A]",
  },
};

const TRACK_ICONS: Partial<Record<DisciplineId, LucideIcon>> = {
  mat: Sigma,
  bio: Dna,
  amat: Ruler,
  biotech: Microscope,
};

const LOCKED_CHIP_ROWS: DisciplineId[][] = [
  ["phy", "che", "eng", "eco"],
  ["log", "gk"],
  ["fin", "ent"],
];

const CHIP_LABEL: Partial<Record<DisciplineId, string>> = {
  eng: "Verbal",
  eco: "Quantitative",
  log: "Analytical",
  gk: "General Knowledge (GK)",
  fin: "Financial Literacy (FinLit)",
};

const CHIP_TONE_FOR: Partial<Record<DisciplineId, ChipTone>> = {
  phy: "teal",
  che: "amber",
  eng: "teal",
  eco: "teal",
  log: "purple",
  gk: "gold",
  fin: "pink",
  ent: "gold",
  mat: "teal",
  bio: "teal",
  amat: "purple",
  biotech: "purple",
};

/** Visual lineup order from the Step 5 mock — storage slots stay 1–10. */
const LINEUP_DISPLAY: Array<{
  n: number;
  tone: ChipTone;
  id?: DisciplineId;
  slot?: 3 | 4;
  emptyLabel: string;
}> = [
  { n: 1, tone: "teal", id: "phy", emptyLabel: "Physics" },
  { n: 2, tone: "amber", id: "che", emptyLabel: "Chemistry" },
  { n: 3, tone: "teal", id: "eng", emptyLabel: "Verbal" },
  { n: 4, tone: "teal", id: "eco", emptyLabel: "Quant" },
  { n: 5, tone: "purple", id: "log", emptyLabel: "Analytical" },
  { n: 6, tone: "gold", id: "gk", emptyLabel: "GK" },
  { n: 7, tone: "pink", id: "fin", emptyLabel: "FinLit" },
  { n: 8, tone: "gold", id: "ent", emptyLabel: "Entrep" },
  { n: 9, tone: "teal", slot: 3, emptyLabel: "—" },
  { n: 10, tone: "purple", slot: 4, emptyLabel: "—" },
];

interface DisciplinePickerProps {
  lineup: DisciplineLineup;
  onChange: (lineup: DisciplineLineup) => void;
  onContinue: () => void;
  onBack: () => void;
}

function toneFor(id: DisciplineId): ChipTone {
  return CHIP_TONE_FOR[id] ?? "teal";
}

function LockedChip({ def }: { def: DisciplineDef }) {
  const tone = CHIP_TONE[toneFor(def.id)];
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-[10px] border-[1.5px] bg-white/[0.02] px-4 py-2.5 text-[13.5px] font-semibold",
        tone.border,
        tone.text,
      )}
    >
      <span>{CHIP_LABEL[def.id] ?? def.name}</span>
      <span className="ml-1 inline-flex size-4 items-center justify-center rounded-[4px] bg-white text-[11px] font-black text-[#0B0E14]">
        ✓
      </span>
    </div>
  );
}

function PathOption({
  def,
  selected,
  selectedTone,
  interactive,
  onClick,
}: {
  def: DisciplineDef;
  selected: boolean;
  selectedTone: "teal" | "purple";
  interactive: boolean;
  onClick?: () => void;
}) {
  const Icon = TRACK_ICONS[def.id] ?? Atom;
  const selectedStyles: Record<"teal" | "purple", { box: string; card: string }> = {
    teal: {
      box: "bg-[#1D9E75] border-[#1D9E75]",
      card: "border-[rgba(29,158,117,0.7)] bg-[rgba(29,158,117,0.08)]",
    },
    purple: {
      box: "bg-[#7F77DD] border-[#7F77DD]",
      card: "border-[rgba(127,119,221,0.7)] bg-[rgba(127,119,221,0.08)]",
    },
  };
  const selectedBox = selectedStyles[selectedTone].box;
  const selectedCard = selectedStyles[selectedTone].card;

  const className = cn(
    "flex w-full min-h-11 items-center justify-between rounded-[9px] border-[1.5px] px-3.5 py-3 text-left transition-colors",
    selected ? selectedCard : "border-[#1E2430] bg-transparent",
    interactive && "cursor-pointer hover:border-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D9E75]",
    !interactive && "cursor-default",
  );

  const body = (
    <>
      <span className="flex min-w-0 items-center gap-2.5 text-[13.5px] font-semibold text-[#F2F4F8]">
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-[#8B93A3]">
          <Icon className="size-3.5" />
        </span>
        <span className="truncate">{def.name}</span>
      </span>
      <span
        className={cn(
          "inline-flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] text-[11px] font-black text-[#0B0E14]",
          selected ? selectedBox : "border-[#1E2430] bg-transparent",
        )}
        aria-hidden
      >
        {selected ? "✓" : ""}
      </span>
    </>
  );

  if (!interactive) {
    return (
      <div className={className}>{body}</div>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={className}>
      {body}
    </button>
  );
}

export function DisciplinePicker({ lineup, onChange, onContinue, onBack }: DisciplinePickerProps) {
  useEffect(() => {
    const next = lockEntrepreneurshipSlot(lineup);
    if (next !== lineup) onChange(next);
  }, [lineup, onChange]);

  const count = filledCount(lineup);
  const complete = isLineupComplete(lineup);
  const trackA = DISCIPLINE_SLOTS.find((s) => s.track === "A")!;
  const trackB = DISCIPLINE_SLOTS.find((s) => s.track === "B")!;

  const pickFamily = (id: DisciplineId) => {
    onChange(lockEntrepreneurshipSlot(selectTrackOption(lineup, "A", id)));
  };

  return (
    <div className="flex w-full flex-col">
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <h2 className="text-[25px] font-bold leading-tight tracking-[-0.01em] text-[#F2F4F8]">
            Choose your Decathlon disciplines
          </h2>
          <p className="mt-1 text-[13.5px] text-[#8B93A3]">
            Locked cores stay. Pick one family path — the linked subject follows automatically.
          </p>
        </div>
        <div className="min-w-[78px] shrink-0 rounded-[14px] border border-[#1E2430] bg-[#131722] px-[18px] py-[7px] text-center">
          <span className="mb-px block text-[10px] font-semibold tracking-[0.08em] text-[#8B93A3]">
            LOCKED
          </span>
          <span className="block text-[17px] font-bold tabular-nums text-[#1D9E75]">
            {count}/{LINEUP_SIZE}
          </span>
        </div>
      </div>

      <div
        className="mb-[22px] h-1 rounded-full"
        style={{ background: "linear-gradient(90deg,#1D9E75,#378ADD,#7F77DD,#E85D8A)" }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={LINEUP_SIZE}
        aria-valuenow={count}
        aria-label="Disciplines locked"
      />

      <section className="mb-4 rounded-2xl border border-[#1E2430] bg-[#131722] px-5 py-[18px]">
        <div className="mb-[13px] flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-bold tracking-[0.08em] text-[#1D9E75]">LOCKED IN</span>
          <span className="text-xs text-[#8B93A3]">Core sciences + core skills</span>
        </div>
        <div className="flex flex-col gap-3">
          {LOCKED_CHIP_ROWS.map((row) => (
            <div key={row.join("-")} className="flex flex-wrap gap-3">
              {row.map((id) => (
                <LockedChip key={id} def={DISCIPLINES[id]} />
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-4 rounded-2xl border border-[#1E2430] bg-[#131722] px-5 py-[18px]">
        <div className="mb-[13px] flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-bold tracking-[0.08em] text-[#EF9F27]">YOUR PATH</span>
          <span className="rounded-full border border-[rgba(240,180,41,0.4)] bg-[rgba(240,180,41,0.12)] px-2.5 py-0.5 text-[11px] font-semibold text-[#F0B429]">
            Pick 1 of 2 · 2 tracks
          </span>
          <span className="text-xs text-[#8B93A3]">
            Choosing Track A auto-selects its linked Track B subject
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 min-[700px]:grid-cols-2">
          <div className="rounded-xl border border-[#1E2430] bg-white/[0.015] px-4 py-3.5">
            <div className="mb-2.5 flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-bold text-[#F2F4F8]">Track A — pick one</h3>
              <span className="text-[10.5px] text-[#8B93A3]">Slot 3</span>
            </div>
            <div className="flex flex-col gap-2">
              {trackA.options!.map((id) => (
                <PathOption
                  key={id}
                  def={DISCIPLINES[id]}
                  selected={lineup[3] === id}
                  selectedTone="teal"
                  interactive
                  onClick={() => pickFamily(id)}
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#1E2430] bg-white/[0.015] px-4 py-3.5">
            <div className="mb-2.5 flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-bold text-[#F2F4F8]">Track B — auto-linked</h3>
              <span className="text-[10.5px] text-[#8B93A3]">Slot 4</span>
            </div>
            <div className="flex flex-col gap-2" aria-live="polite">
              {trackB.options!.map((id) => (
                <PathOption
                  key={id}
                  def={DISCIPLINES[id]}
                  selected={lineup[4] === id}
                  selectedTone="purple"
                  interactive={false}
                />
              ))}
            </div>
            <p className="mt-2 text-[11px] text-[#8B93A3]">
              Follows whichever family you pick in Track A — no separate choice needed.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#1E2430] bg-[#131722] px-5 py-[18px]">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-[#F2F4F8]">Your lineup</h3>
          <span className="text-[11.5px] text-[#8B93A3]">
            {complete ? "Ready to continue" : "1 of 10 pending"}
          </span>
        </div>
        <div className="flex flex-col gap-2.5">
          {[LINEUP_DISPLAY.slice(0, 5), LINEUP_DISPLAY.slice(5)].map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-3 gap-2.5 min-[560px]:grid-cols-5">
              {row.map((item) => {
                const id = item.id ?? (item.slot ? lineup[item.slot] : null);
                const def = id ? DISCIPLINES[id] : null;
                const tone = CHIP_TONE[item.tone];
                return (
                  <div
                    key={item.n}
                    title={def?.name ?? item.emptyLabel}
                    className="rounded-[10px] border border-[#1E2430] bg-white/[0.015] px-1.5 pb-2 pt-2.5 text-center"
                  >
                    <span
                      className={cn(
                        "mx-auto mb-1.5 flex size-[17px] items-center justify-center rounded-[5px] text-[10px] font-extrabold text-[#0B0E14]",
                        tone.num,
                      )}
                    >
                      {item.n}
                    </span>
                    <span
                      className={cn(
                        "block truncate text-[11px] font-semibold",
                        def ? "text-[#F2F4F8]" : "text-[#8B93A3]",
                      )}
                    >
                      {def?.shortName ?? item.emptyLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-5 flex items-center gap-3.5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex size-[42px] shrink-0 items-center justify-center rounded-full border border-[#1E2430] bg-[#131722] text-[#F2F4F8] transition-colors hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D9E75]"
          aria-label="Previous step"
        >
          <ArrowLeft className="size-4" />
        </button>
        <button
          type="button"
          disabled={!complete}
          onClick={onContinue}
          className={cn(
            "h-auto flex-1 rounded-xl py-[13px] text-[14.5px] font-extrabold transition-all",
            complete
              ? "bg-gradient-to-r from-[#1D9E75] to-[#22C08A] text-[#062017] shadow-[0_0_20px_rgba(29,158,117,0.3)]"
              : "cursor-not-allowed border border-[#1E2430] bg-[#131722] text-[#8B93A3]",
          )}
        >
          {complete
            ? "Continue with your 10 disciplines →"
            : "Choose a Track A subject to continue →"}
        </button>
      </div>
    </div>
  );
}
