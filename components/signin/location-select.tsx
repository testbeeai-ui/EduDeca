"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type LocationSelectProps = {
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function LocationSelect({
  label,
  placeholder,
  value,
  options,
  disabled = false,
  onChange,
}: LocationSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const listEl = listRef.current;
    if (!listEl) return;

    function onWheel(event: WheelEvent) {
      event.preventDefault();
      event.stopPropagation();
      const target = event.currentTarget as HTMLUListElement | null;
      if (!target) return;
      target.scrollTop += event.deltaY;
    }

    listEl.addEventListener("wheel", onWheel, { passive: false });
    return () => listEl.removeEventListener("wheel", onWheel);
  }, [open]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-2xl border border-border bg-input/50 px-4 text-left text-base",
          value ? "text-foreground" : "text-muted-foreground",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && !disabled ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          data-lenis-prevent
          onWheel={(event) => event.stopPropagation()}
          onTouchMove={(event) => event.stopPropagation()}
          className="absolute bottom-full left-0 z-[80] mb-1 max-h-72 w-full overflow-y-auto overscroll-contain rounded-xl border border-white/10 bg-[#141A23] py-1 text-sm text-white shadow-xl dark-scrollbar"
        >
          <li>
            <button
              type="button"
              role="option"
              aria-selected={!value}
              onClick={() => pick("")}
              className={cn(
                "w-full px-3 py-1.5 text-left text-white hover:bg-white/10",
                !value && "bg-white/15",
              )}
            >
              {placeholder}
            </button>
          </li>
          {options.map((option) => {
            const selected = option === value;
            return (
              <li key={option}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => pick(option)}
                  className={cn(
                    "w-full px-3 py-1.5 text-left text-white hover:bg-white/10",
                    selected && "bg-white/15",
                  )}
                >
                  {option}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
