"use client";

import {
  ArrowLeft,
  Atom,
  Bot,
  Check,
  Dna,
  FlaskConical,
  Globe2,
  Hash,
  Lightbulb,
  MessageSquare,
  Microscope,
  Puzzle,
  Ruler,
  Sigma,
  Wallet,
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
  selectTrackOption,
  type DisciplineLineup,
} from "@/lib/disciplines/selection";
import type { LevelAccent } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<DisciplineDef["icon"], LucideIcon> = {
  atom: Atom,
  flask: FlaskConical,
  sigma: Sigma,
  dna: Dna,
  ruler: Ruler,
  microscope: Microscope,
  bot: Bot,
  lightbulb: Lightbulb,
  message: MessageSquare,
  hash: Hash,
  puzzle: Puzzle,
  globe: Globe2,
  wallet: Wallet,
};

const ACCENT: Record<
  LevelAccent,
  { border: string; soft: string; ring: string; lane: string }
> = {
  teal: {
    border: "border-emerald-500/35",
    soft: "bg-emerald-500/15 text-emerald-400",
    ring: "shadow-[inset_0_0_0_1px_rgba(29,158,117,0.9)] bg-emerald-500/10",
    lane: "#1D9E75",
  },
  amber: {
    border: "border-amber-500/35",
    soft: "bg-amber-500/15 text-amber-400",
    ring: "shadow-[inset_0_0_0_1px_rgba(239,159,39,0.9)] bg-amber-500/10",
    lane: "#EF9F27",
  },
  violet: {
    border: "border-violet-400/35",
    soft: "bg-violet-500/15 text-violet-300",
    ring: "shadow-[inset_0_0_0_1px_rgba(127,119,221,0.9)] bg-violet-500/10",
    lane: "#7F77DD",
  },
  blue: {
    border: "border-emerald-500/35",
    soft: "bg-emerald-500/15 text-emerald-400",
    ring: "shadow-[inset_0_0_0_1px_rgba(29,158,117,0.9)] bg-emerald-500/10",
    lane: "#1D9E75",
  },
  pink: {
    border: "border-rose-400/35",
    soft: "bg-rose-500/15 text-rose-300",
    ring: "shadow-[inset_0_0_0_1px_rgba(212,83,126,0.9)] bg-rose-500/10",
    lane: "#D4537E",
  },
  rose: {
    border: "border-rose-400/35",
    soft: "bg-rose-500/15 text-rose-300",
    ring: "shadow-[inset_0_0_0_1px_rgba(212,83,126,0.9)] bg-rose-500/10",
    lane: "#D4537E",
  },
};

interface DisciplinePickerProps {
  lineup: DisciplineLineup;
  onChange: (lineup: DisciplineLineup) => void;
  onContinue: () => void;
  onBack: () => void;
}

function LockedChip({ def }: { def: DisciplineDef }) {
  const Icon = ICONS[def.icon];
  const accent = ACCENT[def.accent];
  return (
    <div
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5 rounded-lg border px-2 py-1.5",
        accent.border,
        accent.ring,
      )}
    >
      <span className={cn("inline-flex size-5 shrink-0 items-center justify-center rounded-md", accent.soft)}>
        <Icon className="size-3" />
      </span>
      <span className="truncate text-[11px] font-semibold text-[#EAEEF3]">{def.shortName}</span>
      <span className="inline-flex size-3.5 shrink-0 items-center justify-center rounded-sm bg-white text-emerald-600">
        <Check className="size-2.5 stroke-[3]" />
      </span>
    </div>
  );
}

function ChoiceCard({
  def,
  selected,
  onClick,
}: {
  def: DisciplineDef;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = ICONS[def.icon];
  const accent = ACCENT[def.accent];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-all",
        accent.border,
        selected ? accent.ring : "bg-[#141A23] opacity-65 hover:opacity-100",
      )}
    >
      <span className={cn("inline-flex size-7 shrink-0 items-center justify-center rounded-lg", accent.soft)}>
        <Icon className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-[#EAEEF3]">{def.name}</span>
      <span
        className={cn(
          "inline-flex size-4 shrink-0 items-center justify-center rounded border",
          selected
            ? "border-white bg-white text-emerald-600"
            : "border-white/10 bg-[#1B2330] text-transparent",
        )}
      >
        <Check className="size-2.5 stroke-[3]" />
      </span>
    </button>
  );
}

export function DisciplinePicker({ lineup, onChange, onContinue, onBack }: DisciplinePickerProps) {
  const count = filledCount(lineup);
  const complete = isLineupComplete(lineup);
  const remaining = LINEUP_SIZE - count;

  const pick = (track: "A" | "B" | "C", id: DisciplineId) => {
    onChange(selectTrackOption(lineup, track, id));
  };

  const trackA = DISCIPLINE_SLOTS.find((s) => s.track === "A")!;
  const trackB = DISCIPLINE_SLOTS.find((s) => s.track === "B")!;
  const trackC = DISCIPLINE_SLOTS.find((s) => s.track === "C")!;

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-[#EAEEF3] sm:text-xl">
            Choose your Decathlon disciplines
          </h2>
          <p className="mt-0.5 text-xs text-[#8B96A8] sm:text-[13px]">
            Locked cores stay. Pick one family path and one Track C option.
          </p>
        </div>
        <div className="shrink-0 rounded-xl border border-white/8 bg-[#141A23] px-3 py-2 text-right">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-[#5C6577]">Locked</p>
          <p className="text-sm font-extrabold tabular-nums text-[#EAEEF3]">
            {count}
            <span className="text-[#5C6577]">/{LINEUP_SIZE}</span>
          </p>
        </div>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-[#1B2330]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-violet-400 to-rose-400 transition-[width] duration-300"
          style={{ width: `${(count / LINEUP_SIZE) * 100}%` }}
        />
      </div>

      {/* Mandatory strip — one horizontal band */}
      <section className="rounded-xl border border-white/8 bg-[#141A23]/40 p-2.5">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-400">
            Locked in
          </span>
          <span className="text-[10px] text-[#5C6577]">Core sciences + core skills</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["phy", "che", "eng", "eco", "log", "gk", "fin"] as const).map((id) => (
            <LockedChip key={id} def={DISCIPLINES[id]} />
          ))}
        </div>
      </section>

      {/* Tracks side-by-side to use width, not height */}
      <section className="min-h-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-amber-400">
            Your path
          </span>
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
            Pick 1 of 2 · 3 tracks
          </span>
          <span className="text-[10px] text-[#5C6577]">
            A + B are linked by family (Math or Bio)
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
          <TrackColumn
            label="Track A"
            hint="Slot 3"
            options={trackA.options!}
            selectedId={lineup[3]}
            onPick={(id) => pick("A", id)}
          />
          <TrackColumn
            label="Track B"
            hint="Slot 4 · auto with A"
            options={trackB.options!}
            selectedId={lineup[4]}
            onPick={(id) => pick("B", id)}
          />
          <TrackColumn
            label="Track C"
            hint="Slot 5 · free pick"
            options={trackC.options!}
            selectedId={lineup[5]}
            onPick={(id) => pick("C", id)}
          />
        </div>
      </section>

      {/* Compact lineup + actions */}
      <div className="rounded-xl border border-white/8 bg-[#141A23] p-2.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold text-[#EAEEF3]">Your lineup</p>
          <p className="text-[10px] text-[#5C6577]">
            {complete
              ? "Ready to continue"
              : `${remaining} pick${remaining === 1 ? "" : "s"} left`}
          </p>
        </div>
        <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
          {DISCIPLINE_SLOTS.map((slot) => {
            const id = lineup[slot.slot];
            const def = id ? DISCIPLINES[id] : null;
            const color = def ? ACCENT[def.accent].lane : undefined;
            return (
              <div
                key={slot.slot}
                title={def?.name ?? `Track ${slot.track ?? slot.slot}`}
                className={cn(
                  "flex min-w-0 flex-col items-center gap-0.5 rounded-lg border px-1 py-1.5",
                  def ? "border-transparent" : "border-dashed border-white/10 bg-white/[0.02]",
                )}
                style={
                  def
                    ? {
                        borderColor: color,
                        background: `color-mix(in srgb, ${color} 12%, transparent)`,
                      }
                    : undefined
                }
              >
                <span
                  className={cn(
                    "inline-flex size-4 items-center justify-center rounded font-mono text-[9px] font-extrabold",
                    def ? "text-[#0E1117]" : "bg-[#1B2330] text-[#5C6577]",
                  )}
                  style={def ? { background: color } : undefined}
                >
                  {slot.slot}
                </span>
                <span
                  className={cn(
                    "w-full truncate text-center text-[9px] font-semibold",
                    def ? "text-[#EAEEF3]" : "text-[#5C6577]",
                  )}
                >
                  {def?.shortName ?? (slot.track ? slot.track : "—")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground hover:bg-muted"
          aria-label="Previous step"
        >
          <ArrowLeft className="size-4" />
        </button>
        <button
          type="button"
          disabled={!complete}
          onClick={onContinue}
          className={cn(
            "h-10 flex-1 rounded-xl text-sm font-bold transition-all",
            complete
              ? "bg-gradient-to-r from-emerald-600 to-teal-400 text-[#08130F] shadow-lg shadow-emerald-500/25"
              : "cursor-not-allowed border border-white/10 bg-[#1B2330] text-[#5C6577]",
          )}
        >
          {complete
            ? "Continue with your 10 disciplines →"
            : `Complete ${remaining} more pick${remaining === 1 ? "" : "s"}`}
        </button>
      </div>
    </div>
  );
}

function TrackColumn({
  label,
  hint,
  options,
  selectedId,
  onPick,
}: {
  label: string;
  hint: string;
  options: DisciplineId[];
  selectedId: DisciplineId | null;
  onPick: (id: DisciplineId) => void;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-[#141A23]/50 p-2">
      <div className="mb-1.5 flex items-baseline justify-between gap-2 px-0.5">
        <p className="text-[11px] font-bold text-[#EAEEF3]">{label}</p>
        <p className="text-[9px] text-[#5C6577]">{hint}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <ChoiceCard
          def={DISCIPLINES[options[0]]}
          selected={selectedId === options[0]}
          onClick={() => onPick(options[0])}
        />
        <div className="text-center text-[9px] font-extrabold tracking-wide text-[#5C6577]">OR</div>
        <ChoiceCard
          def={DISCIPLINES[options[1]]}
          selected={selectedId === options[1]}
          onClick={() => onPick(options[1])}
        />
      </div>
    </div>
  );
}
