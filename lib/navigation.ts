import {
  BarChart3,
  ClipboardList,
  Home,
  Star,
  Trophy,
  UserRound,
} from "lucide-react";

export const appNavItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/levels", label: "Levels", icon: BarChart3 },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/rewards", label: "Rewards", icon: Star },
  { href: "/mock-test", label: "Mock Test", icon: ClipboardList },
] as const;

export const profileNavItem = {
  href: "/profile",
  label: "Profile",
  icon: UserRound,
} as const;
