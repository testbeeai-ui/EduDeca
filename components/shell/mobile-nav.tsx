"use client";

import { motion } from "framer-motion";
import { UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { appNavItems } from "@/lib/navigation";
import { springSnappy } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

export function MobileNav() {
  const pathname = usePathname();
  const isSignedIn = useAppStore((s) => s.isSignedIn);

  const navItems: Array<{ href: string; label: string; icon: any }> = [...appNavItems];
  if (!isSignedIn) {
    navItems.splice(1, 0, {
      href: "/signin",
      label: "Sign-in",
      icon: UserRound,
    });
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-border/60 bg-background/95 px-1 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:px-2 lg:hidden"
      aria-label="Mobile navigation"
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="mobile-nav-active"
                className="absolute inset-x-2 inset-y-1 rounded-xl bg-primary/10"
                transition={springSnappy}
              />
            )}
            <motion.span
              className="relative z-10"
              animate={isActive ? { y: [0, -2, 0] } : undefined}
              transition={{ duration: 0.45 }}
            >
              <Icon className="size-5" />
            </motion.span>
            <span className="relative z-10 truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
