"use client";

import { CameraOff, LogOut, Phone, School, Settings, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

import { GlassCard } from "@/components/common/glass-card";
import { MotionFade } from "@/components/common/motion-fade";
import { PageHeader } from "@/components/shell/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { currentUser } from "@/data/user";
import { cn, formatXp, initialsFromName } from "@/lib/utils";
import { useAppStore, useProgressUser } from "@/store/useAppStore";

export default function ProfilePage() {
  const router = useRouter();
  const phone = useAppStore((s) => s.phone);
  const userName = useAppStore((s) => s.userName);
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  const signOut = useAppStore((s) => s.signOut);
  const antiCaptureEnabled = useAppStore((s) => s.antiCaptureEnabled);
  const setAntiCaptureEnabled = useAppStore((s) => s.setAntiCaptureEnabled);
  const progress = useProgressUser();
  const displayName = userName ?? currentUser.name;
  const displayInitials = userName ? initialsFromName(userName) : currentUser.initials;

  const handleLogout = () => {
    signOut();
    router.replace("/signin");
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
              <AvatarFallback className={cn("text-xl font-semibold text-white", currentUser.avatarColor)}>
                {displayInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="text-xl font-bold">{displayName}</h2>
              <p className="text-sm text-muted-foreground">
                {currentUser.grade} · {currentUser.school}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <Phone className="size-4" />
                <span className="text-xs uppercase tracking-wide">Mobile</span>
              </div>
              <p className="font-medium">{phone ? `+91 ${phone}` : "Not linked"}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <School className="size-4" />
                <span className="text-xs uppercase tracking-wide">School</span>
              </div>
              <p className="font-medium">{currentUser.school}</p>
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
                  When on, daily challenges use proctored-style protection — screen capture shortcuts
                  are blocked and a shield overlay appears if capture is attempted.
                </p>
              </div>
              <Switch
                id="anti-capture-toggle"
                checked={antiCaptureEnabled}
                onCheckedChange={setAntiCaptureEnabled}
                aria-label="Block screenshots and recording during challenges"
              />
            </div>
          </div>

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
