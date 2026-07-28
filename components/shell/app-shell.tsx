"use client";

import { usePathname } from "next/navigation";

import { PageTransition } from "@/components/common/page-transition";
import { AuthGate } from "@/components/shell/auth-gate";
import { EduDecaLogo } from "@/components/shell/edudeca-logo";
import { MobileNav } from "@/components/shell/mobile-nav";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { TopBar } from "@/components/shell/top-bar";
import { appNavItems } from "@/lib/navigation";
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
        <div className="flex min-h-dvh flex-col bg-background bg-mesh">
          <header className="flex h-14 items-center border-b border-border/50 px-4 sm:px-6">
            <EduDecaLogo />
          </header>
          <main className="flex flex-1 items-start justify-center px-4 py-6 sm:px-6 sm:py-10">
            <PageTransition>{children}</PageTransition>
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
                "min-h-0 flex-1 overscroll-contain px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 overflow-y-auto",
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

