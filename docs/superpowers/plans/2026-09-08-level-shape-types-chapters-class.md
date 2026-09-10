# Level shape (types / chapters / class) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Daily Challenge Levels 1–3 pick 1 / 2 / 3 questions per discipline from distinct type-or-chapter groups, filtered to the student’s Class 11 or 12, with matching timers and strikes.

**Architecture:** Keep selection as a pure function in `lib/challenge/question-seen.ts`. The questions API loads the profile class + bank columns, filters, then calls `pickUnseenRound`. Spec helpers own card counts, group counts, timers, and strikes. Coverage becomes class- and group-aware. Verbal L3 is re-parsed and re-seeded so the bank has headroom for 10 trials × 3.

**Tech Stack:** Next.js (EduDeca), Supabase (`edudeca_profiles`, `edudeca_discipline_questions`, `edudeca_question_seen`), `npx tsx --test` (node:test), Python parser under `scripts/`.

## Global Constraints

- EduDeca challenge only — do **not** change `edudeca_mock_questions` or Web mock loaders
- Lineup size stays **10** (catalog 12; Track A/B pick one family)
- Round size: Level 1 = **10**, Level 2 = **20**, Level 3 = **30** cards
- Groups per discipline: Level 1 = **1**, Level 2 = **2**, Level 3 = **3** (always distinct)
- Group key = `type` if present, else `chapter`
- Class: profile `11|12` → bank `XI|XII`; keep row when `class_level IS NULL OR matches`
- Missing class → HTTP **409** `code: "CLASS_LEVEL_REQUIRED"`
- Strict: cannot fill N groups → existing coming-soon path (do not duplicate a group)
- Timers: **12 / 24 / 36** minutes; strikes: **5** at every level
- No schema migration; no inventing answer keys for blank Biology/Analytical items
- Do **not** commit unless the user explicitly asks

## File map

| File | Role |
|------|------|
| `lib/challenge/spec.ts` | `challengeQuestionCount`, `challengeGroupsPerDiscipline`, session sec, strikes |
| `lib/challenge/spec.test.ts` | Pacing + counts |
| `lib/challenge/question-seen.ts` | `PoolItem` fields, class filter, group pick inside `pickUnseenRound` |
| `lib/challenge/question-seen.test.ts` | Group / class / size / strict-fail tests |
| `lib/challenge/coverage.ts` | Class-aware + min-groups readiness |
| `lib/challenge/coverage.test.ts` | Ready only when groups suffice for class |
| `app/api/challenge/questions/route.ts` | Load class, select columns, filter, expect N cards |
| `app/api/challenge/availability/route.ts` | Pass class into coverage |
| `lib/challenge/load-daily-challenge.ts` | Treat 409 CLASS_LEVEL_REQUIRED as a gate, not coming-soon |
| `components/challenge/challenge-session.tsx` | Route missing-class to sign-in |
| `scripts/parse_discipline_bank_docx.py` | Verbal L3: ingest full Level-3 bank, stop before leftover L2 |
| `scripts/parse_discipline_bank_docx_test.py` | Expect Verbal L3 = 60 |
| `scripts/seed_discipline_questions.py` | Re-seed after parser fix |
| `package.json` | Add the new/updated unit tests to `test` script |

---

### Task 1: Spec helpers — counts, timer, strikes

**Files:**
- Modify: `EduDeca/lib/challenge/spec.ts`
- Modify: `EduDeca/lib/challenge/spec.test.ts`

**Interfaces:**
- Produces:
  - `challengeQuestionCount(campaignLevel: number): number` → 10 / 20 / 30 (levels ≥4 also 30 until banks exist; callers only use 1–3)
  - `challengeGroupsPerDiscipline(campaignLevel: number): number` → 1 / 2 / 3
  - `challengeSessionDurationSec` → 720 / 1440 / 2160
  - `challengeMaxStrikes` → always 5

- [ ] **Step 1: Write the failing tests**

Replace / extend `lib/challenge/spec.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  challengeGroupsPerDiscipline,
  challengeMaxStrikes,
  challengePerQuestionTotalSec,
  challengeQuestionCount,
  challengeSessionDurationSec,
} from "./spec";

describe("challenge timing", () => {
  it("gives Level-1 a 12-minute set and 45 seconds per question", () => {
    assert.equal(challengeSessionDurationSec(1), 12 * 60);
    assert.equal(challengePerQuestionTotalSec(1), 45);
  });

  it("scales Level-2 and Level-3 session length with card count", () => {
    assert.equal(challengeSessionDurationSec(2), 24 * 60);
    assert.equal(challengeSessionDurationSec(3), 36 * 60);
    assert.equal(challengePerQuestionTotalSec(2), 60);
    assert.equal(challengePerQuestionTotalSec(3), 60);
  });
});

describe("challenge round shape", () => {
  it("uses 10 / 20 / 30 cards and 1 / 2 / 3 groups per discipline", () => {
    assert.equal(challengeQuestionCount(1), 10);
    assert.equal(challengeQuestionCount(2), 20);
    assert.equal(challengeQuestionCount(3), 30);
    assert.equal(challengeGroupsPerDiscipline(1), 1);
    assert.equal(challengeGroupsPerDiscipline(2), 2);
    assert.equal(challengeGroupsPerDiscipline(3), 3);
  });

  it("uses 5 strikes at every free-zone level", () => {
    assert.equal(challengeMaxStrikes(1), 5);
    assert.equal(challengeMaxStrikes(2), 5);
    assert.equal(challengeMaxStrikes(3), 5);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `cd EduDeca; npx tsx --test lib/challenge/spec.test.ts`

Expected: FAIL — missing exports and/or wrong durations (Level 2 still 7 min, strikes still 4/3).

- [ ] **Step 3: Implement**

In `lib/challenge/spec.ts`:

```ts
export function challengeQuestionCount(campaignLevel: number): number {
  const level = Math.max(1, Math.floor(campaignLevel) || 1);
  if (level <= 1) return 10;
  if (level === 2) return 20;
  return 30;
}

export function challengeGroupsPerDiscipline(campaignLevel: number): number {
  const level = Math.max(1, Math.floor(campaignLevel) || 1);
  if (level <= 1) return 1;
  if (level === 2) return 2;
  return 3;
}

export function challengeMaxStrikes(campaignLevel: number): number {
  void campaignLevel;
  return 5;
}

export function challengeSessionDurationSec(campaignLevel: number = 1): number {
  const level = Math.max(1, Math.floor(campaignLevel) || 1);
  if (level <= 1) return 12 * 60;
  if (level === 2) return 24 * 60;
  return 36 * 60;
}
```

Leave `challengePerQuestionTotalSec` as today (45 on L1, 60 after). Update the comment above `challengeMaxStrikes` so it no longer says “Level 2: 4 · Level 3+: 3”.

- [ ] **Step 4: Run tests — expect PASS**

Run: `cd EduDeca; npx tsx --test lib/challenge/spec.test.ts`

Expected: PASS

---

### Task 2: Pure selection — group key, class filter, N per discipline

**Files:**
- Modify: `EduDeca/lib/challenge/question-seen.ts`
- Modify: `EduDeca/lib/challenge/question-seen.test.ts`

**Interfaces:**
- Consumes: `challengeGroupsPerDiscipline` from Task 1 (tests may pass `perDiscipline` explicitly)
- Produces:
  - `PoolItem` with optional `type: string | null`, `chapter: string | null`, `classLevel: "XI" | "XII" | null`
  - `poolGroupKey(item: PoolItem): string | null`
  - `matchesStudentClass(item: PoolItem, studentClass: "XI" | "XII"): boolean`
  - `PickUnseenRoundArgs` gains `studentClass: "XI" | "XII"` and `perDiscipline: number`
  - `pickUnseenRound` returns `perDiscipline × lineup.length` questions on success

- [ ] **Step 1: Write the failing tests**

Update `item()` helper to accept `type` / `chapter` / `classLevel`. Append:

```ts
import { poolGroupKey, matchesStudentClass } from "./question-seen";

describe("poolGroupKey", () => {
  it("prefers type over chapter", () => {
    assert.equal(
      poolGroupKey(item("a", "eng", { type: "TYPE 1 — VOCAB", chapter: "CH 1" })),
      "TYPE 1 — VOCAB",
    );
  });

  it("falls back to chapter for CBSE rows", () => {
    assert.equal(
      poolGroupKey(item("a", "bio", { chapter: "1. BIOLOGICAL CLASSIFICATION" })),
      "1. BIOLOGICAL CLASSIFICATION",
    );
  });
});

describe("matchesStudentClass", () => {
  it("keeps null class_level for both XI and XII", () => {
    assert.equal(matchesStudentClass(item("a", "eng", { classLevel: null }), "XI"), true);
    assert.equal(matchesStudentClass(item("a", "eng", { classLevel: null }), "XII"), true);
  });

  it("keeps only matching CBSE class", () => {
    assert.equal(matchesStudentClass(item("a", "bio", { classLevel: "XI" }), "XI"), true);
    assert.equal(matchesStudentClass(item("a", "bio", { classLevel: "XII" }), "XI"), false);
  });
});

describe("pickUnseenRound groups", () => {
  function groupedBank(level: number, perGroup: number): PoolItem[] {
    return LINEUP.flatMap((disc) => {
      const isCbse = ["phy", "che", "mat", "amat"].includes(disc);
      return [1, 2, 3, 4].flatMap((g) =>
        Array.from({ length: perGroup }, (_, i) =>
          item(`${disc}-g${g}-${i}`, disc, {
            level,
            type: isCbse ? null : `TYPE ${g} — X`,
            chapter: isCbse ? `CHAPTER ${g} — X` : null,
            classLevel: isCbse ? "XI" : null,
          }),
        ),
      );
    });
  }

  it("Level 2 returns 2 questions per discipline from 2 different groups (20 cards)", () => {
    const round = pickUnseenRound({
      bank: groupedBank(2, 3),
      lineupIds: LINEUP,
      seenIds: new Set(),
      level: 2,
      seed: 11,
      studentClass: "XI",
      perDiscipline: 2,
    });
    assert.equal(round.ok, true);
    if (!round.ok) return;
    assert.equal(round.questions.length, 20);
    for (const disc of LINEUP) {
      const qs = round.questions.filter((q) => q.disciplineId === disc);
      assert.equal(qs.length, 2);
      const keys = qs.map((q) => poolGroupKey(q));
      assert.equal(new Set(keys).size, 2);
    }
  });

  it("Level 3 returns 3 questions per discipline from 3 different groups (30 cards)", () => {
    const round = pickUnseenRound({
      bank: groupedBank(3, 2),
      lineupIds: LINEUP,
      seenIds: new Set(),
      level: 3,
      seed: 9,
      studentClass: "XI",
      perDiscipline: 3,
    });
    assert.equal(round.ok, true);
    if (!round.ok) return;
    assert.equal(round.questions.length, 30);
    for (const disc of LINEUP) {
      const qs = round.questions.filter((q) => q.disciplineId === disc);
      assert.equal(qs.length, 3);
      assert.equal(new Set(qs.map((q) => poolGroupKey(q))).size, 3);
    }
  });

  it("never serves XII rows to an XI student but still serves untagged aptitude", () => {
    const bank = [
      item("bio-xi", "bio", { level: 1, chapter: "CH1", classLevel: "XI" }),
      item("bio-xii", "bio", { level: 1, chapter: "CH1", classLevel: "XII" }),
      item("eng-1", "eng", { level: 1, type: "TYPE 1 — V", classLevel: null }),
      ...LINEUP.filter((d) => d !== "bio" && d !== "eng").map((d) =>
        item(`${d}-1`, d, { level: 1, type: "TYPE 1 — X", classLevel: null }),
      ),
    ];
    const round = pickUnseenRound({
      bank,
      lineupIds: LINEUP,
      seenIds: new Set(),
      level: 1,
      seed: 2,
      studentClass: "XI",
      perDiscipline: 1,
    });
    assert.equal(round.ok, true);
    if (!round.ok) return;
    assert.equal(round.questions.find((q) => q.disciplineId === "bio")?.id, "bio-xi");
    assert.equal(round.questions.find((q) => q.disciplineId === "eng")?.id, "eng-1");
  });

  it("fails when a discipline has fewer than N distinct groups left", () => {
    const bank = LINEUP.flatMap((disc) => [
      item(`${disc}-a`, disc, { level: 2, type: "TYPE 1 — X", classLevel: null }),
      item(`${disc}-b`, disc, { level: 2, type: "TYPE 1 — X", classLevel: null }),
    ]);
    const round = pickUnseenRound({
      bank,
      lineupIds: LINEUP,
      seenIds: new Set(),
      level: 2,
      seed: 1,
      studentClass: "XI",
      perDiscipline: 2,
    });
    assert.equal(round.ok, false);
  });

  it("does not reuse a seen question even when its group still has other items", () => {
    const bank = LINEUP.flatMap((disc) => [
      item(`${disc}-a`, disc, { level: 1, type: "TYPE 1 — X", classLevel: null }),
      item(`${disc}-b`, disc, { level: 1, type: "TYPE 1 — X", classLevel: null }),
    ]);
    const round = pickUnseenRound({
      bank,
      lineupIds: LINEUP,
      seenIds: new Set(LINEUP.map((d) => `${d}-a`)),
      level: 1,
      seed: 3,
      studentClass: "XI",
      perDiscipline: 1,
    });
    assert.equal(round.ok, true);
    if (!round.ok) return;
    assert.ok(round.questions.every((q) => q.id.endsWith("-b")));
  });
});
```

Also update **existing** Level-1 `pickUnseenRound` calls in this file to pass `studentClass: "XI"` and `perDiscipline: 1`, and give bank items a `type` or `chapter` so group keys exist (e.g. `type: "TYPE 1 — X"` on every `item()` default via helper, or per-call).

- [ ] **Step 2: Run tests — expect FAIL**

Run: `cd EduDeca; npx tsx --test lib/challenge/question-seen.test.ts`

Expected: FAIL — missing args / exports / still picks 1 without grouping.

- [ ] **Step 3: Implement**

In `lib/challenge/question-seen.ts`:

```ts
export type PoolItem = {
  id: string;
  disciplineId: string;
  level: number;
  published: boolean;
  type?: string | null;
  chapter?: string | null;
  classLevel?: "XI" | "XII" | null;
};

export function poolGroupKey(item: PoolItem): string | null {
  const typed = typeof item.type === "string" ? item.type.trim() : "";
  if (typed) return typed;
  const chapter = typeof item.chapter === "string" ? item.chapter.trim() : "";
  return chapter || null;
}

export function matchesStudentClass(
  item: PoolItem,
  studentClass: "XI" | "XII",
): boolean {
  if (item.classLevel == null) return true;
  return item.classLevel === studentClass;
}

export type PickUnseenRoundArgs = {
  bank: PoolItem[];
  lineupIds: readonly string[];
  seenIds: ReadonlySet<string>;
  level: number;
  seed: number;
  studentClass: "XI" | "XII";
  perDiscipline: number;
};
```

Rewrite the per-discipline loop in `pickUnseenRound`:

1. Eligible = published + level match + not seen + `matchesStudentClass`.
2. For each lineup id: bucket eligible rows by `poolGroupKey` (skip null keys).
3. If `Object.keys(buckets).length < perDiscipline` → push discipline to `missing`.
4. Else shuffle group keys with `hashSeed(\`${seed}|${disciplineId}|groups\`)`, take first `perDiscipline`.
5. For each chosen key, shuffle that bucket with `hashSeed(\`${seed}|${disciplineId}|${key}\`)`, take `[0]`.
6. Append those picks to `picked`.
7. Final shuffle of all picks with `args.seed` (unchanged).

- [ ] **Step 4: Run tests — expect PASS**

Run: `cd EduDeca; npx tsx --test lib/challenge/question-seen.test.ts`

Expected: PASS

---

### Task 3: Coverage — class + min groups

**Files:**
- Modify: `EduDeca/lib/challenge/coverage.ts`
- Modify: `EduDeca/lib/challenge/coverage.test.ts`

**Interfaces:**
- Consumes: `challengeGroupsPerDiscipline`, `CATALOG_SIZE` / `DISCIPLINE_IDS`
- Produces:
  - `CoverageRow = { level, subject_id, type?, chapter?, class_level? }`
  - `readyLevelsFromRows(rows, studentClass: "XI" | "XII"): LevelReadyMap`
  - A level is ready when **every** catalog discipline has ≥ `challengeGroupsPerDiscipline(level)` distinct group keys among rows that match the student class (null class_level counts for both)

- [ ] **Step 1: Write the failing tests**

```ts
it("marks Level 2 ready only when each discipline has 2 groups for this class", () => {
  const rows = [];
  for (const subject_id of [
    "phy","che","mat","amat","bio","biotech","ent","eng","eco","log","gk","fin",
  ]) {
    rows.push(
      { level: 2, subject_id, type: "TYPE 1 — A", class_level: null },
      { level: 2, subject_id, type: "TYPE 2 — B", class_level: null },
    );
  }
  // Physics only one group for XI after class filter simulation: add XII-only second group
  const ready = readyLevelsFromRows(
    [
      ...rows.filter((r) => !(r.subject_id === "phy" && r.type === "TYPE 2 — B")),
      { level: 2, subject_id: "phy", chapter: "CH 2", class_level: "XII" },
    ],
    "XI",
  );
  assert.equal(ready[2], false);
});

it("counts null class_level toward both classes", () => {
  const rows = [
    "phy","che","mat","amat","bio","biotech","ent","eng","eco","log","gk","fin",
  ].flatMap((subject_id) => [
    { level: 1, subject_id, type: "TYPE 1 — A", class_level: null },
  ]);
  assert.equal(readyLevelsFromRows(rows, "XI")[1], true);
  assert.equal(readyLevelsFromRows(rows, "XII")[1], true);
});
```

Update existing tests to pass `"XI"` as the second argument.

- [ ] **Step 2: Run — expect FAIL**

Run: `cd EduDeca; npx tsx --test lib/challenge/coverage.test.ts`

- [ ] **Step 3: Implement**

Replace distinct-subject counting with: for each level, for each catalog discipline, collect group keys from rows where `class_level` is null or equals `studentClass`, using the same type-then-chapter key rule. Ready iff every discipline has `groups >= challengeGroupsPerDiscipline(level)`.

Keep `isLevelBankReady` only if still useful; otherwise delete and update callers.

- [ ] **Step 4: Run — expect PASS**

---

### Task 4: Questions API — class + columns + card count

**Files:**
- Modify: `EduDeca/app/api/challenge/questions/route.ts`

**Interfaces:**
- Consumes: `pickUnseenRound`, `challengeQuestionCount`, `challengeGroupsPerDiscipline`
- Produces: JSON pack with `questions.length === challengeQuestionCount(level)`; or 409 `{ code: "CLASS_LEVEL_REQUIRED" }`

- [ ] **Step 1: Load profile class after auth**

```ts
const { data: profile, error: profileError } = await supabase
  .from("edudeca_profiles")
  .select("class_level")
  .eq("id", user.id)
  .maybeSingle();

if (profileError) {
  return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
}

const rawClass = profile && typeof profile.class_level === "number" ? profile.class_level : null;
if (rawClass !== 11 && rawClass !== 12) {
  return NextResponse.json(
    { error: "Choose Class 11 or Class 12 to start", code: "CLASS_LEVEL_REQUIRED" },
    { status: 409 },
  );
}
const studentClass = rawClass === 11 ? "XI" : "XII";
```

- [ ] **Step 2: Widen select and map PoolItem**

```ts
.select(
  "id, discipline_id, stem, options, correct_index, explanation, difficulty_rating, level, published, type, chapter, class_level",
)
```

Map each row into `PoolItem` including `type`, `chapter`, `classLevel` (`"XI"|"XII"|null`).

- [ ] **Step 3: Call picker with new args**

```ts
const perDiscipline = challengeGroupsPerDiscipline(level);
const expected = challengeQuestionCount(level);
const picked = pickUnseenRound({
  bank: /* mapped */,
  lineupIds: subjectOrder,
  seenIds,
  level,
  seed,
  studentClass,
  perDiscipline,
});
```

Replace `questions.length !== LINEUP_SIZE` with `questions.length !== expected`.

- [ ] **Step 4: Manual smoke (dev)**

With a Class 11 test account: `GET /api/challenge/questions?level=1` → 10 cards; `level=2` → 20; `level=3` → 30. With class cleared on profile → 409 `CLASS_LEVEL_REQUIRED`.

---

### Task 5: Availability API + load-path for missing class

**Files:**
- Modify: `EduDeca/app/api/challenge/availability/route.ts`
- Modify: `EduDeca/lib/challenge/load-daily-challenge.ts`
- Modify: `EduDeca/components/challenge/challenge-session.tsx` (and/or `challenge-blocked` / start control)

**Interfaces:**
- Availability: if no class → `{ ready: null, code: "CLASS_LEVEL_REQUIRED" }` (or same 409 pattern the client already understands); if class set → select `level, discipline_id, type, chapter, class_level` and call `readyLevelsFromRows(rows, studentClass)`
- Load: 409 with `CLASS_LEVEL_REQUIRED` is **not** coming-soon; surface a gate the session can redirect to `/signin`

- [ ] **Step 1: Availability**

Mirror Task 4’s profile class read. On missing class return JSON the client can detect. On success pass full coverage rows into the updated helper.

- [ ] **Step 2: Load error typing**

In `load-daily-challenge.ts`, when `body.code === "CLASS_LEVEL_REQUIRED"`, throw `ChallengeLoadError` with that code and `comingSoon = false`.

- [ ] **Step 3: Session UI**

Where gate codes are handled today, add `CLASS_LEVEL_REQUIRED` → send the student to the sign-in class step (same route already used when profile is incomplete). Do not show the coming-soon panel.

- [ ] **Step 4: Smoke**

Missing-class profile opens challenge → prompted to set class, not “coming soon”.

---

### Task 6: Verbal Level 3 bank — full 60 questions

**Files:**
- Modify: `EduDeca/scripts/parse_discipline_bank_docx.py`
- Modify: `EduDeca/scripts/parse_discipline_bank_docx_test.py`
- Run: `EduDeca/scripts/seed_discipline_questions.py`

**Interfaces:**
- `parse_discipline_bank_docx` for Verbal L3 returns **60** questions (not 20)
- Collect folder still groups eng L3 correctly; seed upserts `l3-eng-*` through 60 slots for eng (sort_order continues across the discipline/level group as today)

- [ ] **Step 1: Diagnose the Word structure**

```powershell
cd EduDeca\scripts
python -c "from parse_l1_docx import extract_paragraphs; from parse_discipline_bank_docx import BANK_DIR, ANSWER_KEY_RE, Q_HEAD_RE; lines=extract_paragraphs(BANK_DIR/'eduDeca Verbal Ability Level-3.docx'); print('paras',len(lines)); print('keys',[i for i,l in enumerate(lines) if ANSWER_KEY_RE.search(l)]); print('qheads',sum(1 for l in lines if Q_HEAD_RE.match(l.strip())))"
```

Use the output to decide where leftover Level-2 starts (second answer key, “Level 2” heading, or Q1 restart after first key).

- [ ] **Step 2: Failing parser test**

Change `ParseVerbalLevel3StopsAtFirstKeyTest` into `ParseVerbalLevel3FullBankTest`:

```python
def test_ingests_sixty_level_three_items(self) -> None:
    path = BANK_DIR / "eduDeca Verbal Ability Level-3.docx"
    questions = parse_discipline_bank_docx(path)
    self.assertEqual(len(questions), 60)
    self.assertTrue(all(q["type"] for q in questions))
```

Keep a separate assertion that leftover L2 stems (if identifiable) are **not** included.

- [ ] **Step 3: Run — expect FAIL** (still 20)

Run: `cd EduDeca\scripts; python -m unittest parse_discipline_bank_docx_test.ParseVerbalLevel3FullBankTest`

- [ ] **Step 4: Implement parser fix**

Preferred approach after diagnosis:

- Parse **all** Level-3 question blocks + their answer keys until a leftover boundary (e.g. a second bank whose stems match known L2 content, or an explicit “Level 2” / duplicate header).
- Do **not** blindly merge every paragraph after the first key if that re-imports L2.

If the file simply cannot yield 60 clean L3 items, stop and report — do not invent questions.

- [ ] **Step 5: Run full parser suite + collect counts**

```powershell
python -m unittest parse_discipline_bank_docx_test
python -c "from parse_discipline_bank_docx import collect_discipline_banks,BANK_DIR; rows=collect_discipline_banks(BANK_DIR); eng=[r for r in rows if r['discipline_id']=='eng' and r['level']==3]; print(len(eng))"
```

Expected: eng L3 = 60; suite PASS.

- [ ] **Step 6: Re-seed**

```powershell
python seed_discipline_questions.py
```

Expected: `edudeca_discipline_questions` count rises by ~40 (20→60 eng L3); `edudeca_mock_questions` still 1440.

Verify SQL:

```sql
select count(*) from edudeca_discipline_questions where discipline_id='eng' and level=3;
-- expect 60
select count(*) from edudeca_mock_questions;
-- expect 1440
```

---

### Task 7: Wire tests into `package.json` + end-to-end check

**Files:**
- Modify: `EduDeca/package.json`

- [ ] **Step 1: Add to `test` script**

Append these paths to the existing `npx tsx --test …` list:

- `lib/challenge/spec.test.ts`
- `lib/challenge/question-seen.test.ts`
- `lib/challenge/coverage.test.ts`

- [ ] **Step 2: Run**

```powershell
cd EduDeca
npm test
npx tsc --noEmit
```

Expected: tests green; typecheck clean for touched files.

- [ ] **Step 3: Manual checklist**

1. Class 11 PCM account → Level 1 = 10 cards, Maths + Applied from XI chapters only  
2. Class 11 PCB account → Biology + Biotech from XI only  
3. Class 12 same tracks → XII only  
4. Level 2 = 20 cards, 2 distinct groups per subject  
5. Level 3 = 30 cards, 3 distinct groups per subject  
6. Replay → no repeated question ids  
7. Missing class → sign-in prompt, not coming soon  
8. Mock papers on EduBlast unchanged  

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| 10 / 20 / 30 cards; 1 / 2 / 3 groups | 1, 2, 4 |
| Group key type then chapter; distinct groups | 2 |
| Seen filter before grouping; seeded shuffles | 2 |
| Class 11/12 filter; aptitude shared | 2, 4 |
| CLASS_LEVEL_REQUIRED 409 | 4, 5 |
| Timers 12/24/36; strikes 5 | 1 |
| Coverage class + groups | 3, 5 |
| Verbal L3 → 60 + re-seed | 6 |
| Mock bank untouched | Global + Task 6 verify |
| No migration | Global |

## Placeholder scan

None intentional. Verbal L3 Step 1 is a short diagnose-then-implement gate because the leftover boundary must be taken from the live docx.

## Type consistency

- `studentClass: "XI" | "XII"` everywhere (profile numbers only at the API boundary)
- `perDiscipline` = groups-per-discipline = questions-per-discipline
- `challengeQuestionCount(level) === 10 * challengeGroupsPerDiscipline(level)` for levels 1–3
