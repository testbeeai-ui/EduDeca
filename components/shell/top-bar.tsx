"use client";

import Link from "next/link";

import { NotificationIcon } from "@/components/shell/notification-icon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { currentUser } from "@/data/user";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

interface TopBarProps {
  title: string;
  className?: string;
}

export function TopBar({ title, className }: TopBarProps) {
  const isSignedIn = useAppStore((s) => s.isSignedIn);

  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-background/60 backdrop-blur-xl px-4 md:px-6 lg:px-8 shadow-sm shadow-black/20",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-emerald-400/80 shadow-[0_0_8px_#10b981]" />
        <p className="text-xs tracking-wider uppercase font-semibold text-muted-foreground/90">{title}</p>
      </div>
      <div className="flex items-center gap-3">
        <NotificationIcon />
        {isSignedIn && (
          <Link
            href="/profile"
            className="rounded-full ring-2 ring-emerald-500/30 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            aria-label="Open profile"
          >
            <Avatar className="size-8">
              <AvatarFallback className={cn("text-xs font-semibold text-white", currentUser.avatarColor)}>
                {currentUser.initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        )}
      </div>
    </header>
  );
}

