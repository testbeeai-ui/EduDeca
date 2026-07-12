"use client";

import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationIconProps {
  hasNotification?: boolean;
  className?: string;
}

export function NotificationIcon({ hasNotification = true, className }: NotificationIconProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn("relative rounded-xl border-border/60 bg-card/50", className)}
      aria-label="Notifications"
    >
      <Bell className="size-4" />
      {hasNotification && (
        <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500" aria-hidden />
      )}
    </Button>
  );
}
