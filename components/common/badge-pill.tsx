import type { LevelAccent } from "@/lib/types";
import { cn } from "@/lib/utils";

import { accentClasses } from "./glass-card";

interface BadgePillProps {
  children: React.ReactNode;
  accent?: LevelAccent;
  active?: boolean;
  className?: string;
}

export function BadgePill({ children, accent = "teal", active = false, className }: BadgePillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active ? accentClasses(accent) : "border-border bg-muted/40 text-muted-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}
