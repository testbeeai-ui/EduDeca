"use client";

import { LeaderboardRow } from "@/components/leaderboard/leaderboard-row";
import { ReferralCard } from "@/components/leaderboard/referral-card";
import { MotionFade } from "@/components/common/motion-fade";
import { PageHeader } from "@/components/shell/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collegeLeaderboard, studentLeaderboard } from "@/data/leaderboard";
import { formatXp } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

export default function LeaderboardPage() {
  const tab = useAppStore((s) => s.leaderboardTab);
  const setLeaderboardTab = useAppStore((s) => s.setLeaderboardTab);

  return (
    <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
      <MotionFade>
        <PageHeader
          title="Leaderboard"
          subtitle="Individual rank feeds straight into your college rank."
        />
      </MotionFade>

      <MotionFade delay={0.05}>
        <Tabs
          value={tab}
          onValueChange={(value) => setLeaderboardTab(value as "students" | "colleges")}
        >
          <TabsList className="w-full max-w-xs">
            <TabsTrigger value="students" className="flex-1">
              Students
            </TabsTrigger>
            <TabsTrigger value="colleges" className="flex-1">
              Colleges
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <ul className="space-y-2">
              {studentLeaderboard.map((entry, index) => (
                <LeaderboardRow key={entry.id} entry={entry} index={index} />
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="colleges">
            <ul className="space-y-2">
              {collegeLeaderboard.map((college) => (
                <li
                  key={college.id}
                  className="flex items-center gap-4 rounded-2xl px-4 py-3 transition-all hover:bg-muted/30"
                >
                  <span className="w-8 text-center text-lg font-bold text-level-amber">
                    {college.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{college.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {college.city} · {college.studentCount} students
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {formatXp(college.totalXp)} XP
                  </span>
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
      </MotionFade>

      <MotionFade delay={0.1}>
        <ReferralCard />
      </MotionFade>
    </div>
  );
}
