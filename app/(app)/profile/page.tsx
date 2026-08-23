"use client";

import { CameraOff, LogOut, Mail, School, Settings, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { GlassCard } from "@/components/common/glass-card";
import { MotionFade } from "@/components/common/motion-fade";
import { TesterToolsPanel } from "@/components/profile/tester-tools-panel";
import { PageHeader } from "@/components/shell/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { currentUser } from "@/data/user";
import { isTesterInvestorEmail } from "@/lib/admin/tester-allowlist";
import { formatStudentId } from "@/lib/identity/student-id";
import { patchAntiCapture } from "@/lib/progress/client";
import { formatSignupClassLabel } from "@/lib/signin/signup-profile";
import { supabase } from "@/lib/supabase/client";
import { cn, formatXp, initialsFromName } from "@/lib/utils";
import { useAppStore, useProgressUser } from "@/store/useAppStore";

export default function ProfilePage() {
  const router = useRouter();
  const avatarUrl = useAppStore((s) => s.avatarUrl);
  const email = useAppStore((s) => s.email);
  const phone = useAppStore((s) => s.phone);
  const userName = useAppStore((s) => s.userName);
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  const studentCode = useAppStore((s) => s.studentCode);
  const studentId = formatStudentId(studentCode);
  const signupClassLevel = useAppStore((s) => s.signupClassLevel);
  const signupCollege = useAppStore((s) => s.signupCollege);
  const signOut = useAppStore((s) => s.signOut);
  const antiCaptureEnabled = useAppStore((s) => s.antiCaptureEnabled);
  const setAntiCaptureEnabled = useAppStore((s) => s.setAntiCaptureEnabled);
  const hydrateProgress = useAppStore((s) => s.hydrateProgress);
  const progress = useProgressUser();
  const displayName = userName ?? currentUser.name;
  const displayInitials = userName ? initialsFromName(userName) : currentUser.initials;
  const isAdmin = isTesterInvestorEmail(email);
  const classLabel = formatSignupClassLabel(signupClassLevel) ?? currentUser.grade;
  const collegeLabel = signupCollege.trim() || currentUser.school;

  const handleAntiCaptureChange = (enabled: boolean) => {
    setAntiCaptureEnabled(enabled);
    void patchAntiCapture(enabled).then((serverProgress) => {
      if (serverProgress) hydrateProgress(serverProgress);
    });
  };

  const handleLogout = async () => {
    signOut();
    await supabase.auth.signOut({ scope: "local" });
    router.replace("/home");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 sm:space-y-8">
      <MotionFade>
        <PageHeader title="Profile" subtitle="Your account and learning identity." />
      </MotionFade>

      <MotionFade delay={0.05}>
        <GlassCard className="space-y-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Avatar className="size-16">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="" className="object-cover" /> : null}
              <AvatarFallback className={cn("text-xl font-semibold text-white", currentUser.avatarColor)}>
                {displayInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="text-xl font-bold">{displayName}</h2>
              <p className="text-sm text-muted-foreground">
                {classLabel} · {collegeLabel}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {studentId ? (
              <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 sm:col-span-2">
                <p className="m-0 truncate text-sm font-semibold sm:text-base">
                  Student ID:{" "}
                  <span className="font-mono font-bold tracking-wide">
                    {studentId}
                  </span>
                </p>
              </div>
            ) : null}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <Mail className="size-4" />
                <span className="text-xs uppercase tracking-wide">Account</span>
              </div>
              <p className="truncate font-medium">
                {email ?? (phone ? `+91 ${phone}` : "Not linked")}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <School className="size-4" />
                <span className="text-xs uppercase tracking-wide">School</span>
              </div>
              <p className="font-medium">{collegeLabel}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <Shield className="size-4" />
                <span className="text-xs uppercase tracking-wide">Progress</span>
              </div>
              <p className="font-medium">
                Level {progress.level} · {formatXp(progress.xp)} XP · {progress.zone}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <span className="text-xs uppercase tracking-wide">Streak</span>
              </div>
              <p className="font-medium">Day {progress.streakDays}</p>
            </div>
          </div>

          <TesterToolsPanel />

          {isAdmin ? (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <p className="text-sm font-medium">Admin console</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Verify college registrations from the dedicated admin workspace.
              </p>
              <Button asChild size="sm" className="mt-3">
                <Link href="/admin">Open admin console</Link>
              </Button>
            </div>
          ) : null}

          {isAdmin ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Settings className="size-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Settings</span>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <CameraOff className="size-4 shrink-0 text-primary" />
                    <Label htmlFor="anti-capture-toggle" className="text-sm font-medium text-foreground">
                      Block screenshots &amp; recording
                    </Label>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Only applies to proctored rounds (Level 4+). Free-zone Levels 1–3 never
                    block screenshots.
                  </p>
                </div>
                <Switch
                  id="anti-capture-toggle"
                  checked={antiCaptureEnabled}
                  onCheckedChange={handleAntiCaptureChange}
                  aria-label="Block screenshots and recording during challenges"
                />
              </div>
            </div>
          ) : null}

          <Button
            variant="outline"
            className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={isSignedIn ? handleLogout : () => router.push("/signin")}
          >
            {isSignedIn ? (
              <>
                <LogOut className="size-4" />
                Logout
              </>
            ) : (
              "Sign in to save progress"
            )}
          </Button>
        </GlassCard>
      </MotionFade>
    </div>
  );
}
