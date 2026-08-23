import type { WalkthroughStep } from "@/lib/types";

export const walkthroughSteps: WalkthroughStep[] = [
  {
    id: 1,
    slug: "join-free",
    pillLabel: "Join free",
    stepLabel: "STEP 1 · JOIN FREE",
    title: "10 subjects. 10 questions each.",
    description:
      "Class XI & XII questions across Physics, Chemistry, Mathematics, Applied Mathematics, Biology, Biotechnology, Entrepreneurship, Verbal Ability, Quantitative Ability, Analytical Ability, General Knowledge, and Financial Literacy — pick your path, free forever from Level 1.",
    icon: "target",
    accent: "teal",
  },
  {
    id: 2,
    slug: "go-viral",
    pillLabel: "Go viral",
    stepLabel: "STEP 2 · GO VIRAL",
    title: "Your college is on the leaderboard too.",
    description:
      "Every score adds to your college's public rank. Squad up, refer classmates, and earn streak bonuses — this is a competition your whole campus can see.",
    icon: "trophy",
    accent: "blue",
  },
  {
    id: 3,
    slug: "level-up",
    pillLabel: "Level up",
    stepLabel: "STEP 3 · LEVEL UP",
    title: "Levels 4–6 are proctored — and worth it.",
    description:
      "Once you're ready, pay ₹999 to unlock verified, college-proctored rounds. This is where casual players become ranked contenders.",
    icon: "lock",
    accent: "violet",
  },
  {
    id: 4,
    slug: "go-national",
    pillLabel: "Go national",
    stepLabel: "STEP 4 · GO NATIONAL",
    title: "Level 7–10 Finals. Real prize money.",
    description:
      "Sponsor-backed metro finals from Dec 2026. Winning student takes ₹10 Lakhs, and every finalist moves straight into Edublast for deep prep.",
    icon: "graduation",
    accent: "violet",
  },
  {
    id: 5,
    slug: "disciplines",
    pillLabel: "Pick path",
    stepLabel: "STEP 5 · YOUR PATH",
    title: "Choose your Decathlon disciplines",
    description:
      "Locked cores stay. Pick one family path — the linked subject follows automatically.",
    icon: "target",
    accent: "amber",
  },
  {
    id: 6,
    slug: "sign-in",
    pillLabel: "Sign in",
    stepLabel: "FINAL STEP · SIGN IN",
    title: "Start Today …",
    description: "No passwords. Continue with Google to enter EduDeca.",
    icon: "phone",
    accent: "teal",
  },
];

export const WALKTHROUGH_SIGN_IN_STEP = 6;
export const WALKTHROUGH_DISCIPLINES_STEP = 5;
export const WALKTHROUGH_TOTAL_STEPS = walkthroughSteps.length;
