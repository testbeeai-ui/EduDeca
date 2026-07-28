"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { currentUser } from "@/data/user";
import { springSnappy } from "@/lib/motion";
import { supabase } from "@/lib/supabase/client";
import { cn, initialsFromName } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const signOut = useAppStore((s) => s.signOut);
  const email = useAppStore((s) => s.email);
  const phone = useAppStore((s) => s.phone);
  const userName = useAppStore((s) => s.userName);
  const displayName = userName ?? currentUser.name;
  const displayInitials = userName ? initialsFromName(userName) : currentUser.initials;

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    signOut();
    await supabase.auth.signOut({ scope: "local" });
    router.replace("/signin");
  };

  return (
    <div ref={menuRef} className="relative border-t border-sidebar-border p-3">
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={springSnappy}
            className="absolute bottom-full left-3 right-3 mb-2 overflow-hidden rounded-xl border border-border bg-card shadow-xl"
          >
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-muted"
            >
              <UserRound className="size-4 text-muted-foreground" />
              Profile
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-muted"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors",
          "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        <Avatar className="size-9 shrink-0">
          <AvatarFallback className={cn("text-sm font-semibold text-white", currentUser.avatarColor)}>
            {displayInitials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {email ?? (phone ? `+91 ${phone}` : `${currentUser.grade} · ${currentUser.school}`)}
          </p>
        </div>
        <motion.span animate={{ rotate: open ? 0 : 180 }} transition={springSnappy}>
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
        </motion.span>
      </button>
    </div>
  );
}
