"use client";

import { usePathname } from "next/navigation";

import { PageTransition } from "@/components/common/page-transition";
import { AuthGate } from "@/components/shell/auth-gate";
import { EduDecaLogo } from "@/components/shell/edudeca-logo";
import { MobileNav } from "@/components/shell/mobile-nav";
import { ReturningUserLogin } from "@/components/shell/returning-user-login";
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
  "/college/signin": "College Registration",
  "/college/pending": "College Application",
  "/college/portal": "College Portal",
  "/admin": "Admin Console",
  "/levels": "Level Map",
  "/leaderboard": "Leaderboard",
  "/rewards": "Rewards",
  "/profile": "Profile",
  "/challenge": "Daily Challenge",
};

function isCollegeAuthPath(pathname: string): boolean {
  return (
    pathname === "/college/signin" ||
    pathname === "/college/pending" ||
    pathname === "/college/portal"
  );
}

function isAdminConsolePath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const hasHydrated = useAppStore((s) => s.hasHydrated);
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  const isAuthPage = pathname === "/signin";
  const isCollegeAuthPage = isCollegeAuthPath(pathname);
  const isAdminPage = isAdminConsolePath(pathname);
  const isChallengePage = pathname === "/challenge";
  const isLevelsPage = pathname === "/levels";
  const title =
    pageTitles[pathname] ?? appNavItems.find((item) => item.href === pathname)?.label ?? "EduDeca";
  const showMobileReturningLogin = hasHydrated && !isSignedIn;

  return (
    <AuthGate>
      {isAdminPage ? (
        <div className="min-h-dvh overflow-y-auto bg-[#0a0e12]">
          <PageTransition>{children}</PageTransition>
        </div>
      ) : isCollegeAuthPage ? (
        <div className="min-h-dvh overflow-y-auto bg-[#070B0D]">
          <PageTransition>{children}</PageTransition>
        </div>
      ) : isAuthPage ? (
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
          <div
            className={cn(
              "flex h-dvh min-w-0 flex-1 flex-col overflow-hidden lg:ml-60 lg:pb-0",
              showMobileReturningLogin ? "pb-[9.5rem]" : "pb-[4.5rem]",
            )}
          >
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
          {showMobileReturningLogin ? (
            <div className="fixed inset-x-0 bottom-[4.5rem] z-40 border-t border-border/50 bg-background/95 px-3 py-2.5 backdrop-blur-xl lg:hidden">
              <ReturningUserLogin compact />
            </div>
          ) : null}
          <MobileNav />
        </div>
      )}
    </AuthGate>
  );
}

