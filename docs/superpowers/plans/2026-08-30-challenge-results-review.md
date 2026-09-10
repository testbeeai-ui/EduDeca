# Challenge results review + attempts display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean Daily Challenge results card (no nested answer key), DB-backed 10-attempt meter on fail, full-page answer review when reveal rules allow.

**Architecture:** Pure helpers for trials snapshot and attempts copy. `POST /api/challenge/complete` returns `trials` after inserting into `edudeca_level_trials`. Session uses that remaining count. `ChallengeSummary` stays a centered status card; `ChallengeAnswerReview` is a sibling full-page view toggled by session phase.

**Tech Stack:** Next.js 16, React 19, Supabase, `npx tsx --test` (node:test), Tailwind.

## Global Constraints

- EduDeca only — do not change EduBite or Web
- 10 fail attempts per level (`STUDENT_TRIALS_PER_LEVEL`); testers unlimited (`remaining: null`)
- Students do not see the answer key on fails 1–9; key on win or 10th fail; testers always after a finished run
- Quit never counts as a fail and never reveals the key
- Correct-answer-only on review (no selected option, no full option list)
- No new routes; review is an in-session phase
- Do not commit unless the user asks

## File map

| File | Role |
|------|------|
| `lib/challenge/trials.ts` | `LevelTrialsSnapshot`, `trialsSnapshotFromFailCount` |
| `lib/challenge/trials.test.ts` | Snapshot + existing gate tests |
| `lib/challenge/attempts-copy.ts` | Results-card attempts panel copy |
| `lib/challenge/attempts-copy.test.ts` | Copy tests |
| `app/api/challenge/complete/route.ts` | Return `trials` after insert |
| `lib/challenge/load-daily-challenge.ts` | Parse `trials` from complete |
| `components/challenge/challenge-summary.tsx` | Remove nested key; attempts panel; Review CTA |
| `components/challenge/challenge-answer-review.tsx` | Full-page 2-column review |
| `components/challenge/challenge-session.tsx` | `review` phase; server remaining |
| `package.json` | Add `attempts-copy.test.ts` to `test` script |

---

### Task 1: Trials snapshot helper

**Files:**
- Modify: `EduDeca/lib/challenge/trials.ts`
- Modify: `EduDeca/lib/challenge/trials.test.ts`

**Interfaces:**
- Produces: `LevelTrialsSnapshot`, `trialsSnapshotFromFailCount(args)`

- [ ] **Step 1: Write the failing tests**

Append to `lib/challenge/trials.test.ts`:

```ts
import {
  trialsSnapshotFromFailCount,
} from "./trials";

it("builds a student snapshot after the 4th fail", () => {
  const snap = trialsSnapshotFromFailCount({
    failCount: 4,
    unlimited: false,
    requestedLevel: 1,
    campaignLevel: 1,
    todayCompleted: false,
  });
  assert.equal(snap.failCount, 4);
  assert.equal(snap.remaining, 6);
  assert.equal(snap.limit, 10);
  assert.equal(snap.gate, "ok");
  assert.equal(snap.unlimited, false);
});

it("marks the student not eligible after 10 fails", () => {
  const snap = trialsSnapshotFromFailCount({
    failCount: 10,
    unlimited: false,
    requestedLevel: 1,
    campaignLevel: 1,
    todayCompleted: false,
  });
  assert.equal(snap.remaining, 0);
  assert.equal(snap.gate, "trials_exhausted");
});

it("serializes tester remaining as null", () => {
  const snap = trialsSnapshotFromFailCount({
    failCount: 99,
    unlimited: true,
    requestedLevel: 1,
    campaignLevel: 1,
    todayCompleted: true,
  });
  assert.equal(snap.remaining, null);
  assert.equal(snap.unlimited, true);
  assert.equal(snap.gate, "ok");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run from `EduDeca`:

```bash
npx tsx --test lib/challenge/trials.test.ts
```

Expected: FAIL — `trialsSnapshotFromFailCount` is not exported.

- [ ] **Step 3: Implement snapshot helper**

In `lib/challenge/trials.ts` add:

```ts
export type LevelTrialsSnapshot = {
  failCount: number;
  remaining: number | null;
  limit: number;
  gate: TrialGateReason;
  unlimited: boolean;
};

export function trialsSnapshotFromFailCount(args: {
  failCount: number;
  unlimited: boolean;
  requestedLevel: number;
  campaignLevel: number;
  todayCompleted: boolean;
}): LevelTrialsSnapshot {
  return {
    failCount: args.failCount,
    remaining: remainingTrialsPayload(args.failCount, args.unlimited),
    limit: STUDENT_TRIALS_PER_LEVEL,
    gate: gateStudentLevelAccess(args),
    unlimited: args.unlimited,
  };
}
```

- [ ] **Step 4: Re-run tests**

```bash
npx tsx --test lib/challenge/trials.test.ts
```

Expected: PASS.

---

### Task 2: Attempts copy helper

**Files:**
- Create: `EduDeca/lib/challenge/attempts-copy.ts`
- Create: `EduDeca/lib/challenge/attempts-copy.test.ts`
- Modify: `EduDeca/package.json` (`test` script)

**Interfaces:**
- Consumes: `ChallengeSummaryReason`, `isFailOutcome`
- Produces: `failAttemptsPanel(args) => FailAttemptsPanel | null`

- [ ] **Step 1: Write the failing test**

`lib/challenge/attempts-copy.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { failAttemptsPanel } from "./attempts-copy";

describe("failAttemptsPanel", () => {
  it("hides for testers", () => {
    assert.equal(
      failAttemptsPanel({
        reason: "strikes",
        remaining: null,
        unlimited: true,
        limit: 10,
      }),
      null,
    );
  });

  it("hides on win and quit", () => {
    assert.equal(
      failAttemptsPanel({
        reason: "won",
        remaining: 9,
        unlimited: false,
        limit: 10,
      }),
      null,
    );
    assert.equal(
      failAttemptsPanel({
        reason: "quit",
        remaining: 9,
        unlimited: false,
        limit: 10,
      }),
      null,
    );
  });

  it("shows remaining after a fail", () => {
    const panel = failAttemptsPanel({
      reason: "strikes",
      remaining: 6,
      unlimited: false,
      limit: 10,
    });
    assert.deepEqual(panel, {
      used: 4,
      remaining: 6,
      limit: 10,
      exhausted: false,
      title: "Level attempts",
      description: "6 of 10 attempts left. You can try this level again from Home.",
    });
  });

  it("marks the student not eligible at 0 remaining", () => {
    const panel = failAttemptsPanel({
      reason: "time",
      remaining: 0,
      unlimited: false,
      limit: 10,
    });
    assert.equal(panel?.exhausted, true);
    assert.equal(panel?.used, 10);
    assert.equal(
      panel?.description,
      "0 of 10 attempts left. You are not eligible to continue this level.",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx tsx --test lib/challenge/attempts-copy.test.ts
```

Expected: FAIL — module missing.

- [ ] **Step 3: Implement copy helper**

`lib/challenge/attempts-copy.ts`:

```ts
import type { ChallengeSummaryReason } from "@/lib/types";

import { isFailOutcome } from "./trials";

export type FailAttemptsPanel = {
  used: number;
  remaining: number;
  limit: number;
  exhausted: boolean;
  title: string;
  description: string;
};

export function failAttemptsPanel(args: {
  reason: ChallengeSummaryReason;
  remaining: number | null;
  unlimited: boolean;
  limit: number;
}): FailAttemptsPanel | null {
  if (args.unlimited) return null;
  if (args.remaining == null) return null;
  if (!isFailOutcome(args.reason)) return null;
  const remaining = Math.max(0, args.remaining);
  const limit = args.limit;
  const used = Math.min(limit, Math.max(0, limit - remaining));
  const exhausted = remaining <= 0;
  return {
    used,
    remaining,
    limit,
    exhausted,
    title: "Level attempts",
    description: exhausted
      ? `0 of ${limit} attempts left. You are not eligible to continue this level.`
      : `${remaining} of ${limit} attempts left. You can try this level again from Home.`,
  };
}
```

- [ ] **Step 4: Add the file to package.json `test` and re-run**

Insert `lib/challenge/attempts-copy.test.ts` next to `lib/challenge/trials.test.ts` in the `test` script.

```bash
npx tsx --test lib/challenge/attempts-copy.test.ts
```

Expected: PASS.

---

### Task 3: Complete API returns trials after insert

**Files:**
- Modify: `EduDeca/app/api/challenge/complete/route.ts`
- Modify: `EduDeca/lib/challenge/load-daily-challenge.ts`

**Interfaces:**
- Consumes: `trialsSnapshotFromFailCount`, `countLevelFailTrials`
- Produces: complete JSON `{ saved, progress?, trials? }`; `saveChallengeAttempt` returns `{ progress, trials }`

- [ ] **Step 1: After a successful `insertLevelTrial`, recount fails and attach snapshot**

Import `trialsSnapshotFromFailCount`. After insert, before/with the progress response:

```ts
const failCountAfter = await countLevelFailTrials(supabase, user.id, level);
const trials = trialsSnapshotFromFailCount({
  failCount: failCountAfter,
  unlimited,
  requestedLevel: level,
  campaignLevel: current.campaignLevel,
  todayCompleted: body.reason === "won" ? true : current.todayCompleted,
});
```

Every success JSON that currently returns `{ saved: true, progress }` (and the `progressError` branch) must include `trials`. Guest/quit skips stay without `trials`.

- [ ] **Step 2: Parse trials in `saveChallengeAttempt`**

Change return type to:

```ts
export type ChallengeCompleteSaveResult = {
  progress: EduDecaProgress | null;
  trials: LevelTrialsSnapshot | null;
};

export async function saveChallengeAttempt(...): Promise<ChallengeCompleteSaveResult> {
  // on !ok or throw: return { progress: null, trials: null }
  const body = (await res.json()) as {
    progress?: EduDecaProgress;
    trials?: LevelTrialsSnapshot;
  };
  return {
    progress: body.progress ?? null,
    trials: body.trials ?? null,
  };
}
```

Update `app/(app)/challenge/page.tsx` `handleComplete` to use `result.progress` instead of treating the promise as progress directly.

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors from the new return type.

---

### Task 4: Results card — no nested key, attempts panel, Review CTA

**Files:**
- Modify: `EduDeca/components/challenge/challenge-summary.tsx`

**Interfaces:**
- Consumes: `failAttemptsPanel`, `shouldRevealAnswerKey` (caller decides `onReview`)
- Produces: `onReview?: () => void`; `remainingAfterThisRun`; no answer-key list in this component

- [ ] **Step 1: Remove the nested `max-h-[40vh]` answer-key block from `ChallengeSummary`**

Keep `answerKey` off this component. Delete the scroll box. Props no longer include `answerKey`.

- [ ] **Step 2: Render attempts panel from `failAttemptsPanel`**

Between description and buttons:

- Title `Level attempts`
- 10 segment row (`div`s): first `used` filled (amber if remaining, rose if exhausted), rest muted
- `description` from the helper (amber when remaining, rose when exhausted)

- [ ] **Step 3: Add Review answers button**

If `onReview` is passed, render an outline button **above** Return to Home labeled `Review answers`. Caller only passes `onReview` when `shouldRevealAnswerKey` is true.

---

### Task 5: Full-page answer review + session wiring

**Files:**
- Create: `EduDeca/components/challenge/challenge-answer-review.tsx`
- Modify: `EduDeca/components/challenge/challenge-session.tsx`
- Modify: `EduDeca/app/(app)/challenge/page.tsx` (only if `saveChallengeAttempt` call site still needs the new shape)

**Interfaces:**
- Consumes: `ChallengeAnswerKeyItem` (move type to review component or a tiny shared type in `challenge-summary` export — keep export on summary or move to `lib/challenge/answer-key.ts`; prefer keeping the type next to review and re-export if needed)
- Produces: session phase `"review"`

- [ ] **Step 1: Add `ChallengeAnswerReview`**

Layout:

- `flex min-h-0 flex-1 flex-col` filling the challenge shell
- Header: `Answer key` + `{correct}/{total}`
- Scrollable `grid gap-4 md:grid-cols-2` of items: `Q{n} · {subject}`, stem via `MathText`, correct `{A-D}. {option}`
- Footer: `Back to results` (outline) + `Return to Home Page` (primary)

- [ ] **Step 2: Session phase `review`**

`SessionPhase = "playing" | "summary" | "review"`.

On summary:

- Optimistic remaining: fail → `max(0, (remainingAttempts ?? 10) - 1)`, else unchanged. Testers: `null`.
- `onComplete` stays fire-and-forget from session, but page `handleComplete` should still save. Have session accept optional `onComplete` that returns `Promise<ChallengeCompleteSaveResult | void>` **or** keep page save and have session fetch nothing — spec says session replaces optimistic remaining when save resolves.

Preferred: change `onComplete` to return `Promise<ChallengeCompleteSaveResult | void>`. Page `handleComplete` becomes async, calls `saveChallengeAttempt`, hydrates progress, returns the result. Session `finalizeRun` awaits it and `setTrialsAfterRun(result.trials)`.

Pass `onReview={() => setPhase("review")}` only when `shouldRevealAnswerKey`.

If `phase === "review"`, render `ChallengeAnswerReview` instead of `ChallengeSummary`.

- [ ] **Step 3: Run tests + typecheck**

```bash
npx tsx --test lib/challenge/trials.test.ts lib/challenge/attempts-copy.test.ts
npx tsc --noEmit
```

Expected: PASS / no errors.

---

## Verification (manual)

Signed-in student (not tester): fail a run → results card has no answer list, attempts meter shows N/10 left, no Review button if remaining > 0. After 10th fail → “not eligible” copy + Review answers → full-page grid → Back to results. Tester: no meter, Review always after finish, answers use the grid not a nested scroller.
