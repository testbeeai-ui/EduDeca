import type { SquadInfo } from "@/lib/types";

export const squadInfo: SquadInfo = {
  name: "Quark Squad",
  nationalRank: 6,
  membersActive: 4,
  totalMembers: 4,
  referralPrompt: "Refer 1 more friend to unlock a squad badge.",
  members: [
    { id: "m1", name: "Ishita Rao", initials: "I", avatarColor: "bg-rose-400" },
    { id: "m2", name: "Rohan Verma", initials: "R", avatarColor: "bg-blue-400" },
    { id: "m3", name: "Sneha Iyer", initials: "S", avatarColor: "bg-amber-400" },
    { id: "m4", name: "Aarav Mehta", initials: "A", avatarColor: "bg-violet-500" },
  ],
};
