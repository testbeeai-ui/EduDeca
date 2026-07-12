"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { springSnappy } from "@/lib/motion";
import { useAppStore } from "@/store/useAppStore";

interface ChallengeCTAProps {
  className?: string;
}

export function ChallengeCTA({ className }: ChallengeCTAProps) {
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  const campaignLevel = useAppStore((s) => s.campaignLevel);
  const isProctoredPaid = useAppStore((s) => s.isProctoredPaid);
  const todayCompleted = useAppStore((s) => s.todayCompleted);

  const blocked = campaignLevel >= 4 && !isProctoredPaid;
  const challengeHref = isSignedIn ? "/challenge" : "/signin?redirect=/challenge";

  if (isSignedIn && todayCompleted && !blocked) {
    return (
      <Button
        size="lg"
        variant="secondary"
        disabled
        className="h-12 w-full flex-wrap rounded-2xl text-sm font-semibold sm:h-14 sm:text-base gap-2"
      >
        <CheckCircle2 className="size-4" />
        Completed today
        <Badge variant="secondary">10 Q</Badge>
      </Button>
    );
  }

  const label = blocked ? "Unlock proctored round" : "Start Today's Challenge";

  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      transition={springSnappy}
    >
      <Button
        asChild
        size="lg"
        className="cta-breathe h-12 w-full flex-wrap rounded-2xl text-sm font-semibold sm:h-14 sm:text-base"
      >
        <Link href={challengeHref}>
          {label}
          <Badge variant="secondary" className="bg-primary-foreground/10 text-primary-foreground">
            10×10
          </Badge>
          <motion.span
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex"
          >
            <ArrowRight className="size-4" />
          </motion.span>
        </Link>
      </Button>
    </motion.div>
  );
}
