import { subjects } from "@/data/subjects";
import type { ChallengeQuestion } from "@/lib/types";
import { shuffleChallengeOptions } from "@/lib/challenge/shuffle";

const QUESTION_BANK: ChallengeQuestion[] = [
  {
    id: "phy-1",
    subjectId: "phy",
    stem: "What is the SI unit of force?",
    options: ["Newton", "Joule", "Watt", "Pascal"],
    correctIndex: 0,
    explanation: "Force is measured in Newtons (N).",
    difficultyRating: 2,
  },
  {
    id: "phy-2",
    subjectId: "phy",
    stem: "Which quantity remains conserved in an elastic collision?",
    options: ["Momentum only", "Kinetic energy only", "Both momentum and kinetic energy", "Neither"],
    correctIndex: 2,
    explanation: "In elastic collisions, both momentum and kinetic energy are conserved.",
    difficultyRating: 3,
  },
  {
    id: "che-1",
    subjectId: "che",
    stem: "What is the atomic number of carbon?",
    options: ["4", "6", "8", "12"],
    correctIndex: 1,
    explanation: "Carbon has 6 protons, so its atomic number is 6.",
    difficultyRating: 2,
  },
  {
    id: "che-2",
    subjectId: "che",
    stem: "Which gas is produced when an acid reacts with a metal carbonate?",
    options: ["Oxygen", "Hydrogen", "Carbon dioxide", "Nitrogen"],
    correctIndex: 2,
    explanation: "Acid + carbonate → salt + water + CO₂.",
    difficultyRating: 3,
  },
  {
    id: "mat-1",
    subjectId: "mat",
    stem: "What is the derivative of x²?",
    options: ["x", "2x", "x²", "2"],
    correctIndex: 1,
    explanation: "d/dx(x²) = 2x.",
    difficultyRating: 2,
  },
  {
    id: "mat-2",
    subjectId: "mat",
    stem: "If sin θ = 3/5 and θ is acute, what is cos θ?",
    options: ["4/5", "3/4", "5/4", "5/3"],
    correctIndex: 0,
    explanation: "Using sin²θ + cos²θ = 1, cos θ = 4/5.",
    difficultyRating: 4,
  },
  {
    id: "bio-1",
    subjectId: "bio",
    stem: "Which organelle is known as the powerhouse of the cell?",
    options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi body"],
    correctIndex: 1,
    explanation: "Mitochondria produce ATP through cellular respiration.",
    difficultyRating: 2,
  },
  {
    id: "bio-2",
    subjectId: "bio",
    stem: "DNA replication is described as:",
    options: ["Conservative", "Semi-conservative", "Dispersive", "Random"],
    correctIndex: 1,
    explanation: "Each new DNA molecule has one old and one new strand.",
    difficultyRating: 3,
  },
  {
    id: "eng-1",
    subjectId: "eng",
    stem: "Choose the correct synonym for 'abundant':",
    options: ["Scarce", "Plentiful", "Tiny", "Weak"],
    correctIndex: 1,
    explanation: "Abundant means existing in large quantities; plentiful is a synonym.",
    difficultyRating: 2,
  },
  {
    id: "eng-2",
    subjectId: "eng",
    stem: "Identify the figure of speech: 'The wind whispered through the trees.'",
    options: ["Simile", "Metaphor", "Personification", "Hyperbole"],
    correctIndex: 2,
    explanation: "Wind is given the human action of whispering — personification.",
    difficultyRating: 3,
  },
  {
    id: "eco-1",
    subjectId: "eco",
    stem: "When demand increases and supply stays constant, price will:",
    options: ["Fall", "Stay same", "Rise", "Become zero"],
    correctIndex: 2,
    explanation: "Higher demand with unchanged supply pushes prices up.",
    difficultyRating: 2,
  },
  {
    id: "eco-2",
    subjectId: "eco",
    stem: "GDP measures:",
    options: [
      "Total government debt",
      "Total value of goods and services produced",
      "Inflation rate only",
      "Unemployment only",
    ],
    correctIndex: 1,
    explanation: "GDP is the total monetary value of goods and services produced in a country.",
    difficultyRating: 3,
  },
  {
    id: "fin-1",
    subjectId: "fin",
    stem: "Compound interest means interest is calculated on:",
    options: ["Principal only", "Principal + accumulated interest", "Tax only", "Fees only"],
    correctIndex: 1,
    explanation: "Compound interest earns on both principal and previously earned interest.",
    difficultyRating: 2,
  },
  {
    id: "fin-2",
    subjectId: "fin",
    stem: "An emergency fund should ideally cover:",
    options: ["1 day of expenses", "3–6 months of expenses", "10 years of expenses", "No savings needed"],
    correctIndex: 1,
    explanation: "Financial planners recommend 3–6 months of living expenses.",
    difficultyRating: 3,
  },
  {
    id: "gk-1",
    subjectId: "gk",
    stem: "Which is the largest planet in our solar system?",
    options: ["Earth", "Saturn", "Jupiter", "Neptune"],
    correctIndex: 2,
    explanation: "Jupiter is the largest planet in the solar system.",
    difficultyRating: 1,
  },
  {
    id: "gk-2",
    subjectId: "gk",
    stem: "The capital of France is:",
    options: ["Berlin", "Madrid", "Paris", "Rome"],
    correctIndex: 2,
    explanation: "Paris is the capital of France.",
    difficultyRating: 1,
  },
  {
    id: "log-1",
    subjectId: "log",
    stem: "All cats are mammals. Some mammals are pets. Which conclusion is valid?",
    options: [
      "All cats are pets",
      "Some cats may be pets",
      "No cats are pets",
      "All pets are cats",
    ],
    correctIndex: 1,
    explanation: "Some mammals are pets; cats are mammals, so some cats may be pets.",
    difficultyRating: 3,
  },
  {
    id: "log-2",
    subjectId: "log",
    stem: "If A implies B, and B is false, then A is:",
    options: ["True", "False", "Unknown", "Both true and false"],
    correctIndex: 1,
    explanation: "Modus tollens: if A→B and ¬B, then ¬A.",
    difficultyRating: 4,
  },
];

function hashSeed(parts: (string | number)[]): number {
  const str = parts.join("|");
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function buildDailyChallenge(campaignLevel: number): ChallengeQuestion[] {
  const seed = hashSeed([todayKey(), campaignLevel]);
  const bySubject = new Map<string, ChallengeQuestion[]>();

  for (const q of QUESTION_BANK) {
    const list = bySubject.get(q.subjectId) ?? [];
    list.push(q);
    bySubject.set(q.subjectId, list);
  }

  const picked: ChallengeQuestion[] = [];
  subjects.forEach((subject, idx) => {
    const pool = bySubject.get(subject.id) ?? [];
    if (pool.length === 0) return;
    const pickIndex = (seed + idx * 17) % pool.length;
    const question = pool[pickIndex];
    picked.push(shuffleChallengeOptions(question, seed + idx * 31));
  });

  return picked.slice(0, 10);
}
