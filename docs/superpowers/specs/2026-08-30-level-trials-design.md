# Level trials — 10 fail chances, no replay

Date: 2026-08-30

## Problem

Students could fail a level, then reopen previous levels and harvest that day’s questions (and answer keys). Investors want a hard cap: **10 fail chances per level**, then stop. After a pass, **no going back**. Testers/admins stay unlimited for QA.

## Rules

- Each **student** gets **10 fail attempts per campaign level**. Fail = `strikes`, `time`, or `below_threshold`.
- **Quit does not count.** Win does not consume a fail slot; it qualifies the student to the next level.
- After a **win**, the student cannot load a previous level’s questions. Daily IST lock still applies: the next level opens tomorrow.
- After **10 fails** on the current level, that level is closed. Home/start show “No attempts left”.
- **Testers** (`isTesterInvestorEmail`) skip every gate: unlimited retries, replay, skip-wait, jump_level.
- Students must not see the **answer key** during play, or after fails 1–9. Key only on **win** or the **10th fail**. Testers still see keys.

## Architecture

Server is the source of truth. Client HUD/CTAs are display only.

1. `edudeca_level_trials` stores each completed run (`won` / fail). Fail count is `count` where outcome ∈ fail set.
2. `gateStudentLevelAccess` in `lib/challenge/trials.ts`:
   - tester → `ok`
   - requested < campaign → `level_passed` (no harvest)
   - requested > campaign → `level_locked_ahead`
   - `todayCompleted` → `daily_lock`
   - failCount ≥ 10 → `trials_exhausted`
3. **GET `/api/challenge/questions`** and **POST `/api/challenge/complete`** both run the gate against **server** `campaignLevel`, not the client store.
4. **GET `/api/challenge/trials`** returns remaining / gate for the student’s current level.
5. Challenge page, home CTA, and start control hide Start when `trials_exhausted`.

## Out of scope

- Resetting trials, paid extra attempts, or changing the 10 cap.
- Level 2–10 question banks (still coming soon).
