# Challenge results card + answer review + attempts display

Date: 2026-08-30

## Problem

The Daily Challenge end screen puts the answer key in a nested `max-h-[40vh]` scroller inside a narrow centered card. Most of the viewport is unused, and the pass/fail message is squeezed. Remaining fail attempts (10 per level, from `edudeca_level_trials`) are easy to miss on that same card.

## Goals

1. Results card matches the clean fail screenshot: icon, score, title, explanation, primary Home CTA, Level Map. **No answer key on this card.**
2. Answers open on a **separate full-page review** (in-session, no new route) when the existing reveal rules allow it.
3. After a fail, show **attempts used / left for this level** from the database, with a clear “not eligible” state at 0/10.

## Non-goals

- Changing the 10-fail cap, paid extra attempts, or tester unlimited rules.
- Showing the student’s picked option or full option lists on review (correct answer only).
- A new `/challenge/review` URL.
- Resetting trials or changing Home/start gates (those already exist).

## Decisions

| Topic | Choice |
|---|---|
| Flow | Two-step: summary card → optional Review answers view |
| Review navigation | In-session phase on `/challenge` (`summary` / `review`). Back returns to the same summary. |
| Review content | Stem + correct letter and text only. Qn · discipline. Optional “you got this” on correct items. |
| Review layout | Full remaining viewport. Desktop 2-column grid, phone 1 column. Page scrolls as one document. Sticky bottom: Back to results + Return to Home. |
| Answer key on summary | Never. |
| When Review is offered | Existing `shouldRevealAnswerKey`: win always; tester/unlimited always (except quit); student fail only when remaining after this run is 0. Quit never. |
| Attempts source | Server after `POST /api/challenge/complete` inserts into `edudeca_level_trials`. Optimistic client decrement only as fallback if save fails. |
| Testers | No attempts meter. Unlimited. Review always available after a finished run. |

## Screen 1 — Results card

Keep the current centered card (`max-w-lg` / `lg:max-w-xl`): status icon, `correct/total`, accuracy line, title, description.

**Attempts panel** (students only, fail outcomes `strikes` | `time` | `below_threshold`):

- Label: `Level {n} attempts`
- Meter: 10 segments; filled = used (`limit - remaining`).
- Remaining > 0: `{remaining} of 10 attempts left. You can try this level again from Home.`
- Remaining === 0: `0 of 10 attempts left. You are not eligible to continue this level.`
- Hide the panel for testers (`unlimited` / `remaining === null`) and for `won` / `quit`.

**Actions (top to bottom):**

1. `Review answers` — only when `shouldRevealAnswerKey` is true. Outline/secondary, not the green primary.
2. Existing paywall CTA when win-at-level-3.
3. `Return to Home Page` — primary green button.
4. Optional Try Again (testers only, existing).
5. `View Level Map` on fail (existing).

## Screen 2 — Answer review

Full width of the challenge shell (`max-w-5xl` centered). Header: `Answer key` plus score (`correct/total`) and level. Body: one card per question in `grid gap-4 md:grid-cols-2`. Each card: `Q{n} · {discipline}`, stem (`MathText`), correct answer as `{letter}. {text}`. Footer stays visible: Back to results, Return to Home.

## Data flow

Today `POST /api/challenge/complete` already gates, inserts a row into `edudeca_level_trials`, and returns `{ saved, progress }`. Extend the success body:

```ts
{
  saved: true,
  progress?: EduDecaProgress,
  trials: {
    failCount: number,
    remaining: number | null, // null = tester unlimited
    limit: 10,
    gate: TrialGateReason,
    unlimited: boolean
  }
}
```

`failCount` / `remaining` / `gate` are computed **after** the insert, using the same `countLevelFailTrials` + `gateStudentLevelAccess` + `remainingTrialsPayload` as `GET /api/challenge/trials`.

`saveChallengeAttempt` returns `{ progress, trials }` (trials may be null on guest skip / network error). The session shows an optimistic remaining (`startRemaining - 1` on fail) immediately, then replaces it with `trials.remaining` when the save resolves.

`shouldRevealAnswerKey` continues to use remaining **after this run**.

## Copy (locked)

- Remaining > 0: `{n} of 10 attempts left. You can try this level again from Home.`
- Remaining === 0: `0 of 10 attempts left. You are not eligible to continue this level.`
- Review button: `Review answers`
- Review back: `Back to results`

## Testing seams

Pure helpers, no React:

- `trialsSnapshotFromFailCount` — remaining, gate, unlimited serialization.
- `failAttemptsCopy` — panel vs hidden; remaining vs exhausted strings.

Existing `shouldRevealAnswerKey` / `STUDENT_TRIALS_PER_LEVEL` tests stay.

## Files

- `lib/challenge/trials.ts` — snapshot helper (+ tests in `trials.test.ts`)
- `lib/challenge/attempts-copy.ts` — results-card copy (+ `attempts-copy.test.ts`)
- `app/api/challenge/complete/route.ts` — return `trials` after insert
- `lib/challenge/load-daily-challenge.ts` — parse `trials` from complete
- `components/challenge/challenge-summary.tsx` — no nested key; attempts panel; Review CTA
- `components/challenge/challenge-answer-review.tsx` — new full-page review
- `components/challenge/challenge-session.tsx` — `review` phase; server remaining
- `package.json` `test` script — include `attempts-copy.test.ts`
