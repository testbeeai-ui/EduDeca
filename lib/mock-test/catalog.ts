export type MockTestLevelId = 1 | 2 | 3;
export type MockSetStatus = "new" | "inprogress" | "completed";

export const MOCK_SET_COUNT = 20;

export const MOCK_LEVELS: Array<{
  id: MockTestLevelId;
  title: string;
  sub: string;
  questionCount: number;
  duration: string;
}> = [
  {
    id: 1,
    title: "Level 1 Mock Papers",
    sub: "Foundation · 10 questions each",
    questionCount: 10,
    duration: "15 min",
  },
  {
    id: 2,
    title: "Level 2 Mock Papers",
    sub: "Building up · 20 questions each",
    questionCount: 20,
    duration: "25 min",
  },
  {
    id: 3,
    title: "Level 3 Mock Papers",
    sub: "Free zone finale · 30 questions each",
    questionCount: 30,
    duration: "40 min",
  },
];

export function formatSetNumber(set: number): string {
  return set < 10 ? `0${set}` : String(set);
}
