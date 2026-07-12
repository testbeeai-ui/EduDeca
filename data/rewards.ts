import type { PrizeCard, RewardBadge } from "@/lib/types";

export const prizeCards: PrizeCard[] = [
  {
    id: "trophy",
    title: "Top 3 Colleges",
    subtitle: "Trophies",
    icon: "trophy",
    accent: "violet",
  },
  {
    id: "winner",
    title: "Winning Student",
    subtitle: "₹10 Lakhs",
    icon: "medal-1",
    accent: "amber",
  },
  {
    id: "college",
    title: "Winning College",
    subtitle: "₹10 Lakhs",
    icon: "school",
    accent: "amber",
  },
  {
    id: "runner1",
    title: "1st Runner-up",
    subtitle: "₹5 Lakhs",
    icon: "medal-2",
    accent: "blue",
  },
  {
    id: "runner2",
    title: "2nd Runner-up",
    subtitle: "₹3 Lakhs",
    icon: "medal-3",
    accent: "rose",
  },
  {
    id: "finalists",
    title: "All finalists",
    subtitle: "Badges",
    icon: "ribbon",
    accent: "teal",
  },
];

export const userBadges: RewardBadge[] = [
  { id: "streak", label: "12-day streak", icon: "flame", unlocked: true, accent: "amber" },
  { id: "chem", label: "Chem Level 3", icon: "flask", unlocked: true, accent: "teal" },
  { id: "maths", label: "Maths Level 3", icon: "triangle", unlocked: true, accent: "blue" },
  { id: "referrals", label: "3 referrals", icon: "handshake", unlocked: true, accent: "amber" },
  { id: "proctor", label: "Level 4 proctor", icon: "lock", unlocked: false, accent: "violet" },
];
