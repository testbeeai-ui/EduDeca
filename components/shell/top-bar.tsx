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
        "flex h-14 shrink-0 items-center justify-between border-b border-border/50 px-4 md:px-6 lg:px-8",
        className
      )}
    >
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="flex items-center gap-2">
        <NotificationIcon />
        {isSignedIn && (
          <Link
            href="/profile"
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
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
