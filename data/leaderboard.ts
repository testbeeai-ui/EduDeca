import type { CollegeEntry, LeaderboardEntry } from "@/lib/types";

export const studentLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    id: "s1",
    name: "Ishita Rao",
    school: "Delhi Public School, RKP",
    xp: 4920,
    avatarColor: "bg-rose-400",
  },
  {
    rank: 2,
    id: "s2",
    name: "Rohan Verma",
    school: "Ryan International, Vasant Kunj",
    xp: 4760,
    avatarColor: "bg-blue-400",
  },
  {
    rank: 3,
    id: "s3",
    name: "Sneha Iyer",
    school: "National Public School, Indiranagar",
    xp: 4610,
    avatarColor: "bg-amber-400",
  },
  {
    rank: 4,
    id: "s4",
    name: "Arjun Patel",
    school: "DAV Public School, Ahmedabad",
    xp: 4380,
    avatarColor: "bg-emerald-400",
  },
  {
    rank: 5,
    id: "s5",
    name: "Priya Nair",
    school: "Christ Junior College, Bangalore",
    xp: 4210,
    avatarColor: "bg-violet-400",
  },
  {
    rank: 128,
    id: "user-aarav",
    name: "Aarav Mehta",
    school: "KV Indiranagar",
    xp: 2140,
    avatarColor: "bg-violet-500",
    isCurrentUser: true,
  },
];

export const collegeLeaderboard: CollegeEntry[] = [
  {
    rank: 1,
    id: "c1",
    name: "Delhi Public School, RKP",
    city: "New Delhi",
    totalXp: 48200,
    studentCount: 312,
  },
  {
    rank: 2,
    id: "c2",
    name: "National Public School, Indiranagar",
    city: "Bangalore",
    totalXp: 45100,
    studentCount: 287,
  },
  {
    rank: 3,
    id: "c3",
    name: "Ryan International, Vasant Kunj",
    city: "New Delhi",
    totalXp: 42800,
    studentCount: 264,
  },
  {
    rank: 4,
    id: "c4",
    name: "Christ Junior College",
    city: "Bangalore",
    totalXp: 39600,
    studentCount: 241,
  },
  {
    rank: 6,
    id: "c6",
    name: "KV Indiranagar",
    city: "Bangalore",
    totalXp: 28400,
    studentCount: 198,
  },
];

export const leaderboardPreview = studentLeaderboard.slice(0, 3);
