"use client";

import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProctoredPaywallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPay: () => void;
}

export function ProctoredPaywall({ open, onOpenChange, onPay }: ProctoredPaywallProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="size-5 text-level-violet" />
            Proctored round · Level 4
          </CardTitle>
          <CardDescription>
            You&apos;ve completed the free zone (Levels 1–3). Proctored rounds require identity
            verification and a one-time fee of ₹999 per round tier.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>College-proctored identity verification</li>
            <li>Verified scores on national leaderboard</li>
            <li>Gate to Levels 4–6 and beyond</li>
          </ul>
          <div className="flex flex-col gap-2">
            <Button onClick={onPay}>Pay ₹999 & unlock (demo)</Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Maybe later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
