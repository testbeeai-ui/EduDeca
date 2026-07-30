import katex from "katex";
import { wrapNakedLatex, splitMathChunks } from "../lib/challenge/math-text.ts";

type Q = {
  id: string;
  level: number;
  stem: string;
  options: string[];
  explanation: string | null;
  correct_index: number;
};

const questions: Q[] = [
  { id: "l1-phy-01", level: 1, stem: "Which instrument is used to measure electric current?", options: ["Voltmeter", "Ammeter", "Barometer", "Thermometer"], explanation: null, correct_index: 1 },
  { id: "l1-che-02", level: 1, stem: "Which of the following is an element?", options: ["Water", "Carbon dioxide", "Oxygen", "Common salt"], explanation: null, correct_index: 2 },
  { id: "l1-mat-03", level: 1, stem: "What is the value of 7² − 5²?", options: ["12", "24", "36", "49"], explanation: null, correct_index: 1 },
  { id: "l1-amat-04", level: 1, stem: "A shop sells 5 notebooks for ₹250. What is the cost of one notebook?", options: ["₹40", "₹45", "₹50", "₹55"], explanation: null, correct_index: 2 },
  { id: "l1-bio-05", level: 1, stem: "Which part of a plant mainly absorbs water from the soil?", options: ["Flower", "Leaf", "Root", "Fruit"], explanation: null, correct_index: 2 },
  { id: "l1-biotech-06", level: 1, stem: "Which microorganism is commonly used in bread-making?", options: ["Virus", "Yeast", "Algae", "Protozoan"], explanation: null, correct_index: 1 },
  { id: "l1-cs-07", level: 1, stem: "Which of the following is an output device?", options: ["Keyboard", "Mouse", "Monitor", "Scanner"], explanation: null, correct_index: 2 },
  { id: "l1-ent-08", level: 1, stem: "A person who starts and manages a new business is called:", options: ["Consumer", "Entrepreneur", "Employee", "Creditor"], explanation: null, correct_index: 1 },
  { id: "l1-eng-09", level: 1, stem: "Choose the word closest in meaning to \"rapid.\"", options: ["Slow", "Quick", "Weak", "Quiet"], explanation: null, correct_index: 1 },
  { id: "l1-eco-10", level: 1, stem: "What is 20% of 450?", options: ["45", "75", "90", "100"], explanation: null, correct_index: 2 },
  { id: "l1-log-11", level: 1, stem: "Find the next number: 3, 6, 9, 12, ___", options: ["13", "14", "15", "16"], explanation: null, correct_index: 2 },
  { id: "l1-gk-12", level: 1, stem: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Mercury"], explanation: null, correct_index: 1 },
  { id: "l1-fin-13", level: 1, stem: "Which of the following is money kept aside for future use?", options: ["Savings", "Tax", "Expense", "Debt"], explanation: null, correct_index: 0 },
  { id: "l2-phy-01", level: 2, stem: "A body starts from rest and accelerates uniformly at 2 m s^{-2} for 5 seconds. What is its final velocity?", options: ["5 m s^{-1}", "7 m s^{-1}", "10 m s^{-1}", "20 m s^{-1}"], explanation: "v = u + at = 0 + 2 x 5.", correct_index: 2 },
  { id: "l2-che-02", level: 2, stem: "Which type of bond is formed when electrons are transferred from one atom to another?", options: ["Covalent bond", "Ionic bond", "Hydrogen bond", "Metallic bond"], explanation: "Ionic bonding involves electron transfer.", correct_index: 1 },
  { id: "l2-mat-03", level: 2, stem: "If 2x + 7 = 19, what is the value of x?", options: ["5", "6", "7", "13"], explanation: "2x = 12, so x = 6.", correct_index: 1 },
  { id: "l2-amat-04", level: 2, stem: "A taxi charges a fixed amount of Rs 50 plus Rs 12 per kilometre. What is the total fare for an 8 km journey?", options: ["Rs 96", "Rs 126", "Rs 146", "Rs 156"], explanation: "Fare = 50 + 12 x 8.", correct_index: 2 },
  { id: "l2-bio-05", level: 2, stem: "Which cell organelle controls most cellular activities and contains genetic material?", options: ["Vacuole", "Nucleus", "Ribosome", "Lysosome"], explanation: "It contains DNA and controls cell activities.", correct_index: 1 },
  { id: "l2-biotech-06", level: 2, stem: "Which technique is used to produce many copies of a specific DNA segment?", options: ["Fermentation", "Centrifugation", "Polymerase chain reaction", "Chromatography"], explanation: "PCR amplifies a selected DNA region.", correct_index: 2 },
  { id: "l2-cs-07", level: 2, stem: "What is the main purpose of an algorithm?", options: ["To decorate a computer screen", "To provide step-by-step instructions for solving a problem", "To increase the physical memory of a computer", "To connect a printer to the internet"], explanation: "An algorithm is a logical sequence of instructions.", correct_index: 1 },
  { id: "l2-ent-08", level: 2, stem: "What is a target market?", options: ["Every person in a country", "The group of customers a business aims to serve", "Only the employees of a business", "The competitors of a business"], explanation: "It is the intended customer group.", correct_index: 1 },
  { id: "l2-eng-09", level: 2, stem: "Choose the sentence with correct subject-verb agreement.", options: ["The list of items are on the table.", "The list of items is on the table.", "The lists of item is on the table.", "The list of item were on the table."], explanation: "The subject list is singular.", correct_index: 1 },
  { id: "l2-eco-10", level: 2, stem: "A shirt marked at Rs 1,200 is sold at a discount of 15%. What is its selling price?", options: ["Rs 960", "Rs 1,000", "Rs 1,020", "Rs 1,080"], explanation: "Discount = Rs 180; price = Rs 1,020.", correct_index: 2 },
  { id: "l2-log-11", level: 2, stem: "All roses are flowers. Some flowers fade quickly. Which conclusion definitely follows?", options: ["All roses fade quickly.", "Some roses are not flowers.", "Roses are flowers.", "No flower is a rose."], explanation: "This directly follows from the statement.", correct_index: 2 },
  { id: "l2-gk-12", level: 2, stem: "Which organ of the United Nations is primarily responsible for maintaining international peace and security?", options: ["General Assembly", "Security Council", "International Court of Justice", "Secretariat"], explanation: "It has primary responsibility for international peace and security.", correct_index: 1 },
  { id: "l2-fin-13", level: 2, stem: "Rs 10,000 is invested at 8% simple interest per annum for 2 years. What interest is earned?", options: ["Rs 800", "Rs 1,200", "Rs 1,600", "Rs 1,800"], explanation: "SI = PRT/100 = 10,000 x 8 x 2/100.", correct_index: 2 },
  { id: "l3-phy-01", level: 3, stem: "A 3 kg body moving at 8 m s^{-1} collides with a stationary 5 kg body. They stick together after collision. What is their common velocity?", options: ["2 m s^{-1}", "3 m s^{-1}", "4 m s^{-1}", "5 m s^{-1}"], explanation: "Momentum conservation: 3 x 8 = (3 + 5)v, so v = 3.", correct_index: 1 },
  { id: "l3-che-02", level: 3, stem: "For the equilibrium: N2(g) + 3H2(g) <=> 2NH3(g) Which change favours the formation of ammonia?", options: ["Decreasing pressure", "Increasing volume", "Increasing pressure", "Adding ammonia"], explanation: "The product side has fewer moles of gas.", correct_index: 2 },
  { id: "l3-mat-03", level: 3, stem: "If the roots of x^2 - 9x + k = 0 are 4 and 5, what is the value of k?", options: ["9", "16", "20", "25"], explanation: "Product of roots = k = 4 x 5.", correct_index: 2 },
  { id: "l3-amat-04", level: 3, stem: "The demand for a product is represented by: D = 500 - 20P where D is demand and P is price in rupees. What is the demand when the price is Rs 15?", options: ["100 units", "200 units", "300 units", "400 units"], explanation: "D = 500 - 20 x 15 = 200.", correct_index: 1 },
  { id: "l3-bio-05", level: 3, stem: "A heterozygous tall pea plant, Tt, is crossed with another heterozygous tall plant, Tt. What is the probability of obtaining a dwarf plant?", options: ["1/4", "1/2", "3/4", "1"], explanation: "Tt x Tt gives TT, Tt, Tt and tt.", correct_index: 0 },
  { id: "l3-biotech-06", level: 3, stem: "A bacterial plasmid used to carry a foreign gene into a host cell is called:", options: ["Antibody", "Vector", "Enzyme", "Hormone"], explanation: "A plasmid vector transfers foreign DNA.", correct_index: 1 },
  { id: "l3-cs-07", level: 3, stem: "An AI model performs extremely well on its training data but poorly on new data. This is known as:", options: ["Encryption", "Overfitting", "Compilation", "Compression"], explanation: "The model memorises training patterns and fails to generalise.", correct_index: 1 },
  { id: "l3-ent-08", level: 3, stem: "A startup has monthly fixed costs of Rs 60,000 and earns a contribution of Rs 300 per product sold. How many products must it sell to reach the break-even point?", options: ["100", "150", "200", "300"], explanation: "Break-even units = 60,000/300.", correct_index: 2 },
  { id: "l3-eng-09", level: 3, stem: "Read the statement: The school introduced both additional revision classes and weekly mock tests. Examination results improved. The principal concluded that the mock tests alone caused the improvement. Which is the best evaluation?", options: ["The conclusion is certain because results improved.", "Revision classes may also have contributed to the improvement.", "Mock tests cannot improve performance.", "Results always improve when two changes are introduced."], explanation: "Two interventions occurred, so causation cannot be assigned to one alone.", correct_index: 1 },
  { id: "l3-eco-10", level: 3, stem: "A train travels half the distance at 50 km h^{-1} and the remaining half at 75 km h^{-1}. What is its average speed?", options: ["60 km h^{-1}", "62.5 km h^{-1}", "65 km h^{-1}", "70 km h^{-1}"], explanation: "For equal distances, average speed = 2ab/(a + b).", correct_index: 0 },
  { id: "l3-log-11", level: 3, stem: "Five people - P, Q, R, S and T - stand in a line. Q stands immediately to the right of P. R stands at one end. T stands to the left of S. S does not stand next to R. Which arrangement is possible?", options: ["R, P, Q, T, S", "P, Q, S, T, R", "T, S, R, P, Q", "R, T, S, Q, P"], explanation: "It satisfies all four placement conditions.", correct_index: 0 },
  { id: "l3-gk-12", level: 3, stem: "Which scientific principle explains why a satellite remains in orbit around Earth?", options: ["Conservation of electric charge", "Gravity provides the centripetal force", "Atmospheric pressure supports the satellite", "Magnetic attraction balances its weight"], explanation: "Gravity supplies the inward centripetal force.", correct_index: 1 },
  { id: "l3-fin-13", level: 3, stem: "A portfolio contains: 60% invested in an asset earning 10% 40% invested in an asset earning 5% What is the total portfolio return?", options: ["6%", "7%", "8%", "9%"], explanation: "Weighted return = 0.60 x 10% + 0.40 x 5%.", correct_index: 2 },
];

function renderOk(latex: string, displayMode = false): { ok: boolean; err?: string } {
  try {
    const html = katex.renderToString(latex, {
      throwOnError: true,
      displayMode,
      strict: "ignore",
    });
    if (html.includes("katex-error")) return { ok: false, err: "katex-error class" };
    return { ok: true };
  } catch (e) {
    return { ok: false, err: e instanceof Error ? e.message : String(e) };
  }
}

const mathIssues: string[] = [];
const answerChecks: string[] = [];

for (const q of questions) {
  const fields: [string, string][] = [
    ["stem", q.stem],
    ...q.options.map((o, i) => [`opt${i}`, o] as [string, string]),
  ];
  if (q.explanation) fields.push(["expl", q.explanation]);

  for (const [field, text] of fields) {
    const chunks = splitMathChunks(text);
    for (const c of chunks) {
      if (!c.isMath) {
        if (/\^{[-\d]+}/.test(c.text) || /<=>/.test(c.text)) {
          mathIssues.push(`${q.id}.${field}: leftover bare TeX: "${c.text}"`);
        }
        continue;
      }
      const r = renderOk(c.text, c.displayMode);
      if (!r.ok) mathIssues.push(`${q.id}.${field}: KaTeX FAIL "${c.text}" → ${r.err}`);
    }
  }
}

function expect(id: string, ok: boolean, detail: string) {
  answerChecks.push(`${ok ? "OK" : "WRONG"} ${id}: ${detail}`);
}

expect("l1-mat-03", 49 - 25 === 24 && questions.find((q) => q.id === "l1-mat-03")!.correct_index === 1, "7²−5²=24");
expect("l1-amat-04", 250 / 5 === 50 && questions.find((q) => q.id === "l1-amat-04")!.correct_index === 2, "250/5=50");
expect("l1-eco-10", 0.2 * 450 === 90 && questions.find((q) => q.id === "l1-eco-10")!.correct_index === 2, "20% of 450=90");
expect("l2-phy-01", 0 + 2 * 5 === 10 && questions.find((q) => q.id === "l2-phy-01")!.correct_index === 2, "v=10 m/s");
expect("l2-mat-03", (19 - 7) / 2 === 6 && questions.find((q) => q.id === "l2-mat-03")!.correct_index === 1, "x=6");
expect("l2-amat-04", 50 + 12 * 8 === 146 && questions.find((q) => q.id === "l2-amat-04")!.correct_index === 2, "fare=146");
expect("l2-eco-10", 1200 * 0.85 === 1020 && questions.find((q) => q.id === "l2-eco-10")!.correct_index === 2, "SP=1020");
expect("l2-fin-13", (10000 * 8 * 2) / 100 === 1600 && questions.find((q) => q.id === "l2-fin-13")!.correct_index === 2, "SI=1600");
expect("l3-phy-01", (3 * 8) / (3 + 5) === 3 && questions.find((q) => q.id === "l3-phy-01")!.correct_index === 1, "v=3");
expect("l3-mat-03", 4 * 5 === 20 && questions.find((q) => q.id === "l3-mat-03")!.correct_index === 2, "k=20");
expect("l3-amat-04", 500 - 20 * 15 === 200 && questions.find((q) => q.id === "l3-amat-04")!.correct_index === 1, "D=200");
expect("l3-bio-05", questions.find((q) => q.id === "l3-bio-05")!.correct_index === 0, "tt=1/4");
expect("l3-ent-08", 60000 / 300 === 200 && questions.find((q) => q.id === "l3-ent-08")!.correct_index === 2, "BE=200");
expect("l3-eco-10", Math.abs((2 * 50 * 75) / (50 + 75) - 60) < 1e-9 && questions.find((q) => q.id === "l3-eco-10")!.correct_index === 0, "avg=60");
expect("l3-fin-13", Math.abs(0.6 * 10 + 0.4 * 5 - 8) < 1e-9 && questions.find((q) => q.id === "l3-fin-13")!.correct_index === 2, "return=8%");
expect("l3-log-11", questions.find((q) => q.id === "l3-log-11")!.correct_index === 0, "R,P,Q,T,S valid");
expect("l3-che-02", questions.find((q) => q.id === "l3-che-02")!.correct_index === 2, "increase P favours NH3");

const heavy = ["l2-phy-01", "l3-phy-01", "l3-eco-10", "l3-che-02", "l3-mat-03", "l3-bio-05", "l2-fin-13", "l3-ent-08"];
console.log("=== MATH WRAPS (heavy) ===");
for (const id of heavy) {
  const q = questions.find((x) => x.id === id)!;
  console.log(`\n[${id}]`);
  console.log("  STEM:", wrapNakedLatex(q.stem));
  console.log("  OPTS:", q.options.map((o) => wrapNakedLatex(o)).join(" | "));
  if (q.explanation) console.log("  EXPL:", wrapNakedLatex(q.explanation));
}

console.log("\n=== MATH ISSUES ===");
console.log(mathIssues.length ? mathIssues.join("\n") : "none");
console.log("\n=== ANSWER CHECKS ===");
console.log(answerChecks.join("\n"));
const wrong = answerChecks.filter((x) => x.startsWith("WRONG"));
console.log(`\nTOTAL Qs: ${questions.length} | math issues: ${mathIssues.length} | wrong answers: ${wrong.length}`);
