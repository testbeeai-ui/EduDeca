export type LevelStatus = "completed" | "current" | "locked";

export type LevelTier = "free" | "proctored" | "finals";

export type LevelAccent = "teal" | "violet" | "amber" | "pink" | "blue" | "rose";

export interface UserProfile {
  id: string;
  name: string;
  initials: string;
  grade: string;
  school: string;
  avatarColor: string;
  level: number;
  xp: number;
  streakDays: number;
  rank: number;
  zone: string;
}

export interface Subject {
  id: string;
  name: string;
  abbrev: string;
  level: number;
  accent: LevelAccent;
}

export interface LevelNode {
  number: number;
  title: string;
  subtitle: string;
  status: LevelStatus;
  tier: LevelTier;
  accent: LevelAccent;
  xp?: number;
  price?: string;
}

export interface LevelTierSummary {
  id: LevelTier;
  label: string;
  range: string;
  description: string;
  badge: string;
  accent: LevelAccent;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  school: string;
  xp: number;
  avatarUrl?: string;
  avatarColor: string;
  isCurrentUser?: boolean;
}

export interface CollegeEntry {
  rank: number;
  id: string;
  name: string;
  city: string;
  totalXp: number;
  studentCount: number;
}

export interface RewardBadge {
  id: string;
  label: string;
  icon: string;
  unlocked: boolean;
  accent: LevelAccent;
}

export interface PrizeCard {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  accent: LevelAccent;
}

export interface WalkthroughStep {
  id: number;
  slug: string;
  pillLabel: string;
  stepLabel: string;
  title: string;
  description: string;
  icon: string;
  accent: LevelAccent;
}

export interface SquadMember {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
}

export interface SquadInfo {
  name: string;
  nationalRank: number;
  membersActive: number;
  totalMembers: number;
  referralPrompt: string;
  members: SquadMember[];
}

export type LeaderboardTab = "students" | "colleges";

export interface ChallengeQuestion {
  id: string;
  subjectId: string;
  stem: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  difficultyRating?: number;
}

export interface ChallengeResult {
  questionId: string;
  subjectId: string;
  isCorrect: boolean;
  timeTakenMs: number;
}

export type ChallengeSummaryReason =
  | "won"
  | "strikes"
  | "time"
  | "below_threshold"
  | "quit";

export type ChallengeRoundOutcome = "correct" | "wrong" | "skip";

export interface ChallengeCompletePayload {
  reason: ChallengeSummaryReason;
  correct: number;
  total: number;
  results: ChallengeResult[];
  campaignLevelAtStart: number;
}

export type SubjectLevels = Record<string, number>;
