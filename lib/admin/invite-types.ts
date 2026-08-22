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
  /** Shared org SMTP cap (EduBlast + EduDeca), IST day. */
  dailyLimit: number;
  /** Successful sends logged in transactional_email_logs today (IST). */
  sentToday: number;
  remainingToday: number;
  queuedTomorrowTotal: number;
  /** Asia/Kolkata calendar date for the counters. */
  istDate?: string;
  /** Source label for the admin UI. */
  quotaSource?: "shared_transactional_email_logs";
}

/**
 * @deprecated Use getEmailDailySendCap() / getSharedEmailQuota() — org-wide 500 IST cap.
 * Kept only as a soft UI default clamp, never as a separate pool.
 */
export const INVITE_DAILY_LIMIT = 500;

export const EDUDECA_PUBLIC_SIGNIN_URL = "https://edu-deca.vercel.app/signin";
