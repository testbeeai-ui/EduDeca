export type StudentInviteStatus = "joined" | "sent" | "queued_tomorrow" | "pending";

export interface StudentInviteRecord {
  id: string;
  batchId: string;
  collegeName: string;
  email: string;
  name: string | null;
  studentCode: string | null;
  classLevel: 11 | 12 | null;
  status: StudentInviteStatus;
  invitedAt: string | null;
  joinedAt: string | null;
  notes?: string | null;
}

export interface CollegeInviteBatch {
  id: string;
  collegeName: string;
  totalCount: number;
  sentCount: number;
  queuedCount: number;
  joinedCount: number;
  uploadedAt: string;
  xiCount: number;
  xiiCount: number;
}

export interface DailyQuotaStatus {
  dailyLimit: number;
  sentToday: number;
  remainingToday: number;
  queuedTomorrowTotal: number;
}

/** Default daily SMTP dispatch cap for college invite batches. */
export const INVITE_DAILY_LIMIT = 100;

export const EDUDECA_PUBLIC_SIGNIN_URL = "https://edudeca.com/signin";
