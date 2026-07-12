import { subjects } from "@/data/subjects";
import type {
  ChallengeCompletePayload,
  ChallengeResult,
  SubjectLevels,
} from "@/lib/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEFAULT_SUBJECT_LEVELS: SubjectLevels = Object.fromEntries(
  subjects.map((s) => [s.id, 1])
);

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

interface AppState {
  walkthroughStep: number;
  setWalkthroughStep: (step: number) => void;
  nextWalkthroughStep: () => void;
  prevWalkthroughStep: () => void;
  leaderboardTab: "students" | "colleges";
  setLeaderboardTab: (tab: "students" | "colleges") => void;
  isSignedIn: boolean;
  phone: string | null;
  userName: string | null;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  signIn: (name: string, phone: string) => void;
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
  setProctoredPaid: () => void;
  setAntiCaptureEnabled: (enabled: boolean) => void;
  applyChallengeResult: (payload: ChallengeCompletePayload) => void;
  canStartChallenge: () => boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      walkthroughStep: 1,
      setWalkthroughStep: (step) => set({ walkthroughStep: step }),
      nextWalkthroughStep: () =>
        set((state) => ({ walkthroughStep: Math.min(state.walkthroughStep + 1, 6) })),
      prevWalkthroughStep: () =>
        set((state) => ({ walkthroughStep: Math.max(state.walkthroughStep - 1, 1) })),
      leaderboardTab: "students",
      setLeaderboardTab: (tab) => set({ leaderboardTab: tab }),
      isSignedIn: false,
      phone: null,
      userName: null,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      signIn: (name, phone) =>
        set({
          isSignedIn: true,
          userName: name.trim(),
          phone,
          walkthroughStep: 1,
        }),
      signOut: () =>
        set({
          isSignedIn: false,
          phone: null,
          userName: null,
          walkthroughStep: 1,
        }),
      campaignLevel: 1,
      xp: 0,
      streakDays: 1,
      subjectLevels: { ...DEFAULT_SUBJECT_LEVELS },
      isProctoredPaid: false,
      freeZoneComplete: false,
      lastChallengeDate: null,
      todayCompleted: false,
      antiCaptureEnabled: true,
      setProctoredPaid: () =>
        set({
          isProctoredPaid: true,
          campaignLevel: Math.max(get().campaignLevel, 4),
        }),
      setAntiCaptureEnabled: (enabled) => set({ antiCaptureEnabled: enabled }),
      canStartChallenge: () => {
        const state = get();
        if (state.campaignLevel >= 4 && !state.isProctoredPaid) {
          return false;
        }
        return !state.todayCompleted;
      },
      applyChallengeResult: (payload) => {
        const state = get();
        const today = todayKey();
        const xpGain = payload.correct * 10;
        const nextSubjectLevels = { ...state.subjectLevels };

        for (const result of payload.results) {
          if (!result.isCorrect) continue;
          if (nextSubjectLevels[result.subjectId] !== undefined) {
            nextSubjectLevels[result.subjectId] = Math.min(
              (nextSubjectLevels[result.subjectId] ?? 1) + 1,
              10
            );
          }
        }

        let nextStreak = state.streakDays;
        let nextCampaignLevel = state.campaignLevel;
        let nextFreeZoneComplete = state.freeZoneComplete;
        let nextTodayCompleted = state.todayCompleted;

        if (payload.reason === "won") {
          if (state.lastChallengeDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayKey = yesterday.toISOString().slice(0, 10);
            nextStreak =
              state.lastChallengeDate === yesterdayKey ? state.streakDays + 1 : 1;
          }
          nextTodayCompleted = true;
          if (state.campaignLevel < 3) {
            nextCampaignLevel = state.campaignLevel + 1;
          } else if (state.campaignLevel === 3) {
            nextFreeZoneComplete = true;
          } else if (state.isProctoredPaid && state.campaignLevel < 10) {
            nextCampaignLevel = state.campaignLevel + 1;
          }
        }

        set({
          xp: state.xp + xpGain,
          streakDays: nextStreak,
          subjectLevels: nextSubjectLevels,
          campaignLevel: nextCampaignLevel,
          freeZoneComplete: nextFreeZoneComplete,
          todayCompleted: nextTodayCompleted,
          lastChallengeDate: payload.reason === "won" ? today : state.lastChallengeDate,
        });
      },
    }),
    {
      name: "edudeca-app",
      partialize: (state) => ({
        isSignedIn: state.isSignedIn,
        phone: state.phone,
        userName: state.userName,
        campaignLevel: state.campaignLevel,
        xp: state.xp,
        streakDays: state.streakDays,
        subjectLevels: state.subjectLevels,
        isProctoredPaid: state.isProctoredPaid,
        freeZoneComplete: state.freeZoneComplete,
        lastChallengeDate: state.lastChallengeDate,
        todayCompleted: state.todayCompleted,
        antiCaptureEnabled: state.antiCaptureEnabled,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        const today = todayKey();
        if (state && state.lastChallengeDate !== today) {
          state.todayCompleted = false;
        }
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
  return subjects.map((s) => ({
    ...s,
    level: subjectLevels[s.id] ?? s.level,
  }));
}
