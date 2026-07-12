"use client";

import { motion } from "framer-motion";
import { UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { EduDecaLogo } from "@/components/shell/edudeca-logo";
import { ProfileMenu } from "@/components/shell/profile-menu";
import { appNavItems } from "@/lib/navigation";
import { springSnappy } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

export function SidebarNav() {
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
    <aside className="fixed inset-y-0 left-0 z-40 hidden h-dvh w-60 flex-col border-r border-sidebar-border bg-sidebar/90 backdrop-blur-xl lg:flex">
      <div className="flex h-16 items-center px-5">
        <Link href="/home" aria-label="EduDeca home">
          <EduDecaLogo />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <motion.div key={item.href} whileHover={{ x: 2 }} transition={springSnappy}>
              <Link
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl bg-sidebar-accent"
                    transition={springSnappy}
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-3">
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {isSignedIn && <ProfileMenu />}
    </aside>
  );
}
