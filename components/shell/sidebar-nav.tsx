"use client";

import { motion } from "framer-motion";
import { UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { EduDecaLogo } from "@/components/shell/edudeca-logo";
import { ProfileMenu } from "@/components/shell/profile-menu";
import { ReturningUserLogin } from "@/components/shell/returning-user-login";
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
    <aside className="fixed inset-y-0 left-0 z-40 hidden h-dvh w-60 flex-col border-r border-white/10 bg-sidebar/80 backdrop-blur-2xl lg:flex shadow-2xl shadow-black/50">
      <div className="flex h-16 items-center px-5 border-b border-white/5">
        <Link href="/home" aria-label="EduDeca home" className="group">
          <EduDecaLogo />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 px-3 py-4" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <motion.div key={item.href} whileHover={{ x: 3 }} transition={springSnappy}>
              <Link
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-300",
                  isActive
                    ? "text-emerald-400 font-semibold shadow-lg shadow-emerald-500/10 border border-emerald-500/30"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent"
                    transition={springSnappy}
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-3">
                  <Icon className={cn("size-4 shrink-0 transition-colors", isActive ? "text-emerald-400" : "text-muted-foreground")} />
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute right-2.5 size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {isSignedIn ? <ProfileMenu /> : <ReturningUserLogin />}
    </aside>
  );
}

