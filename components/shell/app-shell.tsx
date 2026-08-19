"use client";

import { usePathname } from "next/navigation";

import { PageTransition } from "@/components/common/page-transition";
import { AuthGate } from "@/components/shell/auth-gate";
import { EduDecaLogo } from "@/components/shell/edudeca-logo";
import { MobileNav } from "@/components/shell/mobile-nav";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { TopBar } from "@/components/shell/top-bar";
import { appNavItems } from "@/lib/navigation";
import {
  AUTH_PAGE_CENTER_CHILD_CLASS,
  AUTH_PAGE_CENTER_CLASS,
  AUTH_PAGE_SCROLL_CLASS,
} from "@/lib/shell/auth-page-layout";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

const pageTitles: Record<string, string> = {
  "/home": "Home",
  "/signin": "Sign-in & Walkthrough",
  "/levels": "Level Map",
  "/leaderboard": "Leaderboard",
  "/rewards": "Rewards",
  "/profile": "Profile",
  "/challenge": "Daily Challenge",
};

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const hasHydrated = useAppStore((s) => s.hasHydrated);
  const isAuthPage = pathname === "/signin";
  const isChallengePage = pathname === "/challenge";
  const isLevelsPage = pathname === "/levels";
  const title =
    pageTitles[pathname] ?? appNavItems.find((item) => item.href === pathname)?.label ?? "EduDeca";

  return (
    <AuthGate>
      {isAuthPage ? (
        <div className="flex h-dvh flex-col overflow-hidden bg-background bg-mesh">
          <header className="flex h-12 shrink-0 items-center border-b border-border/50 px-4 sm:px-6">
            <EduDecaLogo />
          </header>
          <main
            data-lenis-prevent
            className={cn(AUTH_PAGE_SCROLL_CLASS, "dark-scrollbar")}
          >
            <div className={AUTH_PAGE_CENTER_CLASS}>
              <div className={AUTH_PAGE_CENTER_CHILD_CLASS}>
                <PageTransition>{children}</PageTransition>
              </div>
            </div>
          </main>
        </div>
      ) : isChallengePage ? (
        <div className="h-dvh overflow-hidden bg-[#080b10]">
          <PageTransition>{children}</PageTransition>
        </div>
      ) : (
        <div className="flex h-dvh overflow-hidden bg-background bg-mesh">
          <SidebarNav />
          <div className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden pb-[4.5rem] lg:ml-60 lg:pb-0">
            <div className="flex h-14 shrink-0 items-center border-b border-border/50 px-4 lg:hidden">
              <EduDecaLogo />
            </div>
            <TopBar title={title} />
            <main
              data-lenis-prevent
              className={cn(
                "min-h-0 flex-1 overscroll-contain px-3 py-3 sm:px-5 sm:py-4 lg:px-6 lg:py-4 overflow-y-auto",
                !hasHydrated && "opacity-0"
              )}
            >
              <PageTransition>{children}</PageTransition>
            </main>
          </div>
          <MobileNav />
        </div>
      )}
    </AuthGate>
  );
}

