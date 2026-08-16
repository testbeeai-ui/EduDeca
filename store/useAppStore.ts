import { subjects } from "@/data/subjects";
import { WALKTHROUGH_TOTAL_STEPS } from "@/data/walkthrough";
import {
  applyChallengeToProgress,
  jumpCampaignProgress,
  skipDailyWaitProgress,
  withTodayLock,
} from "@/lib/progress/compute";
import { defaultEduDecaProgress, defaultSubjectLevels } from "@/lib/progress/defaults";
import type { EduDecaProgress } from "@/lib/progress/types";
import {
  emptyLineup,
  isLineupComplete,
  lineupIds,
  validateLineup,
  type DisciplineLineup,
} from "@/lib/disciplines/selection";
import type { ChallengeCompletePayload, SubjectLevels } from "@/lib/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  walkthroughStep: number;
  setWalkthroughStep: (step: number) => void;
  nextWalkthroughStep: () => void;
  prevWalkthroughStep: () => void;
  leaderboardTab: "students" | "colleges";
  setLeaderboardTab: (tab: "students" | "colleges") => void;
  isSignedIn: boolean;
  /** Supabase auth.users.id — same Student ID source as Edubite / EduBlast. */
  userId: string | null;
  /** Public Student ID from profiles.student_code (EB-26A0B0C1). */
  studentCode: string | null;
  /** EduDeca invite code from profiles.edudeca_referral_code (ED-267K2M9Q4A). */
  referralCode: string | null;
  /** Google / auth avatar URL (may fail to load — UI must fall back to initials). */
  avatarUrl: string | null;
  phone: string | null;
  email: string | null;
  userName: string | null;
  hasHydrated: boolean;
  progressSynced: boolean;
  setHasHydrated: (value: boolean) => void;
  signIn: (
    name: string,
    options?: {
      userId?: string | null;
      studentCode?: string | null;
      avatarUrl?: string | null;
      phone?: string | null;
      email?: string | null;
    },
  ) => void;
  setStudentCode: (code: string | null) => void;
  setReferralCode: (code: string | null) => void;
  signOut: () => void;
  campaignLevel: number;
  xp: number;
  streakDays: number;
  subjectLevels: SubjectLevels;
  isProctoredPaid: boolean;
  freeZoneComplete: boolean;
  lastChallengeDate: string | null;
  todayCompleted: boolean;
  antiCaptureEnabled: boolean;
  disciplineLineup: DisciplineLineup;
  setDisciplineLineup: (lineup: DisciplineLineup) => void;
  setProctoredPaid: () => void;
  setAntiCaptureEnabled: (enabled: boolean) => void;
  /** Apply server progress snapshot (auth hydrate / admin API / complete). */
  hydrateProgress: (progress: EduDecaProgress) => void;
  /** Tester/investor: clear daily lock locally (then sync via API). */
  skipDailyWait: () => void;
  /** Tester/investor: jump free-zone campaign to level 1–3 locally (then sync). */
  jumpToCampaignLevel: (level: 1 | 2 | 3) => void;
  applyChallengeResult: (payload: ChallengeCompletePayload) => void;
  canStartChallenge: () => boolean;
}

function progressSlice(progress: EduDecaProgress) {
  return {
    campaignLevel: progress.campaignLevel,
    xp: progress.xp,
    streakDays: progress.streakDays,
    subjectLevels: progress.subjectLevels,
    isProctoredPaid: progress.isProctoredPaid,
    freeZoneComplete: progress.freeZoneComplete,
    lastChallengeDate: progress.lastChallengeDate,
    todayCompleted: progress.todayCompleted,
    antiCaptureEnabled: progress.antiCaptureEnabled,
    progressSynced: true as const,
  };
}

function snapshotFromState(state: {
  campaignLevel: number;
  xp: number;
  streakDays: number;
  subjectLevels: SubjectLevels;
  isProctoredPaid: boolean;
  freeZoneComplete: boolean;
  lastChallengeDate: string | null;
  todayCompleted: boolean;
  antiCaptureEnabled: boolean;
}): EduDecaProgress {
  return {
    campaignLevel: state.campaignLevel,
    xp: state.xp,
    streakDays: state.streakDays,
    subjectLevels: state.subjectLevels,
    isProctoredPaid: state.isProctoredPaid,
    freeZoneComplete: state.freeZoneComplete,
    lastChallengeDate: state.lastChallengeDate,
    todayCompleted: state.todayCompleted,
    antiCaptureEnabled: state.antiCaptureEnabled,
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      walkthroughStep: 1,
      setWalkthroughStep: (step) => set({ walkthroughStep: step }),
      nextWalkthroughStep: () =>
        set((state) => ({
          walkthroughStep: Math.min(state.walkthroughStep + 1, WALKTHROUGH_TOTAL_STEPS),
        })),
      prevWalkthroughStep: () =>
        set((state) => ({ walkthroughStep: Math.max(state.walkthroughStep - 1, 1) })),
      leaderboardTab: "students",
      setLeaderboardTab: (tab) => set({ leaderboardTab: tab }),
      isSignedIn: false,
      userId: null,
      studentCode: null,
      referralCode: null,
      avatarUrl: null,
      phone: null,
      email: null,
      userName: null,
      hasHydrated: false,
      progressSynced: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      signIn: (name, options) =>
        set({
          isSignedIn: true,
          userId: options?.userId ?? null,
          studentCode: options?.studentCode ?? null,
          avatarUrl: options?.avatarUrl ?? null,
          userName: name.trim(),
          phone: options?.phone ?? null,
          email: options?.email ?? null,
          walkthroughStep: 1,
        }),
      setStudentCode: (code) => set({ studentCode: code }),
      setReferralCode: (code) => set({ referralCode: code }),
      signOut: () => {
        const defaults = defaultEduDecaProgress();
        set({
          isSignedIn: false,
          userId: null,
          studentCode: null,
          referralCode: null,
          avatarUrl: null,
          phone: null,
          email: null,
          userName: null,
          walkthroughStep: 1,
          ...progressSlice(defaults),
          progressSynced: false,
          disciplineLineup: emptyLineup(),
        });
      },
      campaignLevel: 1,
      xp: 0,
      streakDays: 1,
      subjectLevels: defaultSubjectLevels(1),
      isProctoredPaid: false,
      freeZoneComplete: false,
      lastChallengeDate: null,
      todayCompleted: false,
      antiCaptureEnabled: false,
      disciplineLineup: emptyLineup(),
      setDisciplineLineup: (lineup) => set({ disciplineLineup: lineup }),
      setProctoredPaid: () =>
        set({
          isProctoredPaid: true,
          campaignLevel: Math.max(get().campaignLevel, 4),
        }),
      setAntiCaptureEnabled: (enabled) => set({ antiCaptureEnabled: enabled }),
      hydrateProgress: (progress) => {
        const patch = progressSlice(progress);
        const fromServer = progress.disciplines
          ? validateLineup(progress.disciplines)
          : null;
        if (fromServer) {
          set({ ...patch, disciplineLineup: fromServer });
          return;
        }
        set(patch);
      },
      skipDailyWait: () =>
        set(progressSlice(skipDailyWaitProgress(snapshotFromState(get())))),
      jumpToCampaignLevel: (level) =>
        set(progressSlice(jumpCampaignProgress(snapshotFromState(get()), level))),
      canStartChallenge: () => {
        const state = get();
        if (state.campaignLevel >= 4 && !state.isProctoredPaid) {
          return false;
        }
        return !state.todayCompleted;
      },
      applyChallengeResult: (payload) => {
        const next = applyChallengeToProgress(snapshotFromState(get()), payload);
        set(progressSlice(next));
      },
    }),
    {
      name: "edudeca-app",
      partialize: (state) => ({
        campaignLevel: state.campaignLevel,
        xp: state.xp,
        streakDays: state.streakDays,
        subjectLevels: state.subjectLevels,
        isProctoredPaid: state.isProctoredPaid,
        freeZoneComplete: state.freeZoneComplete,
        lastChallengeDate: state.lastChallengeDate,
        todayCompleted: state.todayCompleted,
        antiCaptureEnabled: state.antiCaptureEnabled,
        disciplineLineup: state.disciplineLineup,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        if (!state) return;
        const locked = withTodayLock({
          campaignLevel: state.campaignLevel,
          xp: state.xp,
          streakDays: state.streakDays,
          subjectLevels: state.subjectLevels,
          isProctoredPaid: state.isProctoredPaid,
          freeZoneComplete: state.freeZoneComplete,
          lastChallengeDate: state.lastChallengeDate,
          todayCompleted: state.todayCompleted,
          antiCaptureEnabled: state.antiCaptureEnabled,
        });
        state.todayCompleted = locked.todayCompleted;
        state.subjectLevels = locked.subjectLevels;
      },
    }
  )
);

export function useProgressUser() {
  const campaignLevel = useAppStore((s) => s.campaignLevel);
  const xp = useAppStore((s) => s.xp);
  const streakDays = useAppStore((s) => s.streakDays);
  const isProctoredPaid = useAppStore((s) => s.isProctoredPaid);

  return {
    level: campaignLevel,
    xp,
    streakDays,
    zone:
      campaignLevel <= 3
        ? "Free Zone"
        : campaignLevel <= 6
          ? "Proctored Zone"
          : "Finals Zone",
    isProctoredPaid,
  };
}

export function useSubjectsWithProgress() {
  const subjectLevels = useAppStore((s) => s.subjectLevels);
  const campaignLevel = useAppStore((s) => s.campaignLevel);
  const disciplineLineup = useAppStore((s) => s.disciplineLineup);

  const selectedIds = isLineupComplete(disciplineLineup)
    ? lineupIds(disciplineLineup)
    : null;

  const catalog = selectedIds
    ? selectedIds
        .map((id) => subjects.find((s) => s.id === id))
        .filter((s): s is (typeof subjects)[number] => Boolean(s))
    : subjects.slice(0, 10);

  return catalog.map((s) => ({
    ...s,
    level: Math.max(subjectLevels[s.id] ?? s.level, campaignLevel),
  }));
}
