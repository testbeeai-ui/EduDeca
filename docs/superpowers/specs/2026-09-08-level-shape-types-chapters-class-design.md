# Level shape — types, chapters, and class 11/12 selection

Date: 2026-09-08

## Problem

The daily challenge picks **one random unseen question per discipline**, at every level. That was correct for Level 1 and wrong for everything after it.

Two things are missing:

1. **Levels 2 and 3 have no structure.** Every question now carries a `type` (aptitude banks) or a `chapter` (CBSE banks), but selection ignores both. A Level 3 round can hand a student three questions from one chapter, or one question where the level is meant to deliver three.
2. **Class is ignored.** `edudeca_discipline_questions.class_level` is `XI` or `XII` for the six CBSE subjects, and `edudeca_profiles.class_level` is `11` or `12` from sign-in, but the challenge route joins neither. A class 11 student can be served class 12 Physics.

## Rules

### Round shape

| Level | Groups per discipline | Questions per discipline | Cards per round | Session | Strikes |
|---|---|---|---|---|---|
| 1 | 1 | 1 | 10 | 12 min | 5 |
| 2 | 2 | 2 | 20 | 24 min | 5 |
| 3 | 3 | 3 | 30 | 36 min | 5 |

- A lineup is **10 disciplines**, not 12. The catalog holds 12; Track A is Maths *or* Biology and Track B is Applied Maths *or* Biotech, so each student plays 10.
- 10 / 20 / 30 matches `MOCK_LEVELS` in `lib/mock-test/catalog.ts`, so challenge and mock now agree on level shape.
- Strikes become **5 at every level**, up from today's 5 / 4 / 3. Level 1 tolerates 50% wrong, Level 3 only 17%. The campaign is meant to get harder.
- Levels 4–10 have no bank and no defined shape. They stay "coming soon".

### Group selection

- **Group key** is `type` when present, otherwise `chapter`. CBSE subjects group by chapter, aptitude subjects by type. No published question is ungrouped, so the single key covers all 12 disciplines.
- Per discipline: filter to unseen, in-class questions first, then collect the group keys that still have at least one question left. Shuffle those keys with a seed derived from the attempt seed and the discipline id, take the first N, and from each chosen group take the first question of a shuffle seeded by the attempt seed plus the group key. Every pick is seeded, so a round is reproducible from its seed.
- Chosen groups are **always distinct**. Two questions from the same type in one round is never allowed.
- `attemptSeed` already mixes `Date.now()` and `Math.random()`, so groups re-randomise on every attempt rather than locking to the same chapters.
- Cards from all 10 disciplines are shuffled together, so subjects interleave. Unchanged from today.

### No repeats

- A question in `edudeca_question_seen` for this student and level is never served again, exactly as today. Grouping filters the pool *before* grouping, so an exhausted group simply stops being an option.
- Trials cap consumption at 10 attempts per level: worst case 30 questions per discipline at Level 3 against a ~60-question class pool. Roughly 2× headroom.

### Class 11 / 12

- Source of truth is `edudeca_profiles.class_level` (`11` | `12`), captured at sign-in. `isSignupClassCollegeReady` already rejects anything else and `sync-signup-profile.ts` persists it. This spec only connects the challenge to it.
- Map `11 → XI`, `12 → XII`. Keep a question when `class_level IS NULL OR class_level = <student class>`.
  - Six CBSE subjects are always tagged → class-pure.
  - Six aptitude subjects are always untagged → shared by both classes.
- A class 11 student who picks Biology draws XI Biology and XI Biotech. Class 12 draws XII Biology and XII Biotech. Same for Maths / Applied Maths.
- **No class set:** the challenge returns HTTP 409 with `code: "CLASS_LEVEL_REQUIRED"`, matching the existing gate-code pattern in `lib/challenge/trials.ts`, and the UI routes the student to the sign-in class step. No guessing, no mixing. One legacy profile is affected.

### Strict failure

If a discipline cannot supply N **distinct** groups of unseen questions, the round is not served and the existing "coming soon" response fires. Serving a duplicate group or a short round is not allowed.

## Architecture

Selection stays a pure function. The route fetches, the function decides.

1. **`lib/challenge/question-seen.ts`** — `PoolItem` gains `type`, `chapter`, `classLevel`. `pickUnseenRound` gains the student class and per-discipline count, and replaces "shuffle, take 1" with group-key shuffle → N distinct groups → one question per group. All of the rule is unit-testable against fake rows.
2. **`lib/challenge/spec.ts`** — question count by level (10/20/30), `challengeSessionDurationSec` → 720 / 1440 / 2160, `challengeMaxStrikes` → 5 at all levels. `CHALLENGE_SPEC.questionCount` is unused by the session UI and becomes level-derived.
3. **`app/api/challenge/questions/route.ts`** — read `edudeca_profiles.class_level`, select `type, chapter, class_level`, filter by class, expect 10/20/30 instead of `LINEUP_SIZE`, return `CLASS_LEVEL_REQUIRED` when class is missing.
4. **`lib/challenge/coverage.ts` + `app/api/challenge/availability/route.ts`** — readiness becomes class-aware and group-aware, so a level cannot report ready and then fail to build a paper.
5. **Verbal Level 3 bank** — the source file keeps a leftover Level 2 section after its first answer key, so only 20 of 60 questions were parsed. At 3 per attempt that runs dry around attempt 7. Re-parse past the first key in `scripts/parse_discipline_bank_docx.py` and re-seed.

No migration. No schema change. `edudeca_mock_questions` is not touched.

## Testing

Written before the code, in the existing `question-seen.test.ts` style:

- Level 2 returns 2 questions per discipline from 2 different groups; Level 3 returns 3 from 3 different groups.
- Levels 1 / 2 / 3 produce exactly 10 / 20 / 30 cards.
- A class 11 student never receives an `XII` row, and still receives untagged aptitude rows.
- A class 12 student never receives an `XI` row.
- Seen questions never reappear; a group whose questions are all seen drops out of the running.
- A discipline with fewer than N distinct groups fails the round instead of duplicating a group.
- Pacing: 720 / 1440 / 2160 seconds and 5 strikes at every level.
- Availability reports a level ready only when the student's class has enough groups.
- Parser: Verbal Level 3 yields 60 questions, and the folder collect still totals correctly.

## Out of scope

- EduBlast mock papers. `edudeca_mock_questions` has no `chapter` and no `class_level`; making mocks class-aware needs a schema change and a re-seed of 1440 rows. Separate work.
- Levels 4–10 banks.
- The four Biology questions whose source answer keys are blank (XI L2 Q14/Q28, XII L3 Q49/Q53) and the 8 skipped Analytical L2 five-option items.
- Changing the 10-attempt trial cap.
