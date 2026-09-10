# Level 4 — coming soon + pay gate

Date: 2026-09-09

## Problem

Levels 1–3 are live in the Daily Challenge. After a Level 3 win, the app already bumps the campaign toward Level 4 and opens a **ProctoredPaywall** that demo-pays (`setProctoredPaid`) and can start a session. That is wrong for the current product:

1. There is **no Level 4 question bank** yet — play should not start.
2. **Real payment is not live** — Pay must not unlock anything.
3. Students who cleared the free zone need one clear message: Level 4 is **coming soon**, and entering it will require **pay** — without teasing L4 before they finish Levels 1–3.

## Goals

- One **combined Level 4 gate** screen: **Coming soon** + **Pay to enter Level 4**.
- Pay opens a **wait popup** only (“Payment coming soon — please wait”). Never sets `isProctoredPaid`. Never starts a challenge.
- **Hard progression:** only students who have **won Levels 1, 2, and 3** (campaign at Level 4) ever see this gate. No Home/levels tease while `campaignLevel ≤ 3`.
- **Admins** (tester/investor allowlist — same emails as Admin console) see that gate **and** a separate **Preview / play Level 4** control when a bank exists.
- As part of this work: **re-verify Levels 1–3** (unit tests + pool readiness) still behave correctly.

## Rules

### Who sees the Level 4 gate

| Actor | When | What they see |
|---|---|---|
| Student | `campaignLevel === 4` (after L3 win), not admin | Combined gate only |
| Tester/investor allowlist treated as **admin** for this feature | Same campaign state | Combined gate **plus** admin preview/play if bank ready |
| Anyone with `campaignLevel ≤ 3` | — | No Level 4 pay/coming-soon CTA |

“Pass 3 levels” means existing campaign progress: win L1, then L2, then L3 under trials / daily lock rules. Skipping ahead stays blocked by `gateStudentLevelAccess` (`level_locked_ahead`).

### Pay behavior (this slice)

- Primary CTA label: **Pay to enter Level 4** (or equivalent; may show fee as future copy, not as a live charge).
- On click: modal/popup — **Payment is coming soon. Please wait.** Dismiss only.
- **Must not** call `setProctoredPaid`, must not write `is_proctored_paid`, must not advance campaign, must not navigate into a challenge load.
- Existing demo unlock path on Pay is **removed** for students and for the default admin gate CTA.

### Coming soon / play

- For students (and for admins using the default gate path): **never** mount `ChallengeSession` for Level 4 in this slice.
- If `/api/challenge/questions?level=4` is hit without admin preview, keep returning coming-soon / unavailable (same `QUESTIONS_UNAVAILABLE` / `comingSoon` pattern as today when the pool is empty).
- When an L4 bank later exists: students still need this gate + real payment (future work). This spec does **not** auto-start L4 play for students just because a bank appears.

### Admin dual path

- Admin = `isTesterInvestorEmail` (current Admin console allowlist). There is no separate admin table in this slice.
- Admins still **see** the combined gate (so they can QA the student UX).
- Extra control: **Preview / play Level 4** — only enabled when availability says Level 4 is ready; starts a normal challenge session for level 4 (tester unlimited trials already apply).
- If Level 4 bank is not ready, preview is disabled or shows the same coming-soon reason; wait popup still available via Pay.

### Levels 5–10

Out of scope for new UX. Leave existing lock/path behavior except: do not leave a path where demo Pay falsely unlocks the proctored zone for everyone.

### Home / Levels / CTA

- While `campaignLevel ≤ 3`: Home challenge CTA stays “start / completed / coming soon for *current* level” — **no** Level 4 pay teaser.
- When `campaignLevel === 4`: Home CTA routes to `/challenge` (or opens the gate). Copy may say Level 4 · Coming soon / Pay — not “Start challenge” as if questions load.
- Levels path for node 4 after free zone: status current with subtitle that matches the gate (coming soon + pay), **not** “Pay ₹999 to unlock” as a working unlock.

## Architecture

### UI units

1. **`Level4Gate` (new or evolved from paywall + coming-soon)**  
   Full-page (or primary challenge-page body): coming-soon messaging + Pay CTA + Back to Home. Admin-only preview control when allowed.

2. **`PaymentWaitDialog` (new small dialog)**  
   Opened only from Pay. Copy: payment coming soon / please wait. Close button.

3. **`ProctoredPaywall`**  
   Stop using it as “demo unlock.” Either retire from challenge page or reduce to shared chrome consumed by `Level4Gate`. Prefer one gate surface over modal-on-modal.

4. **Challenge page (`app/(app)/challenge/page.tsx`)**  
   If `runLevel === 4` and not (admin + preview started): render `Level4Gate` instead of session. Remove `handlePay → setProctoredPaid → setStarted(true)`. Levels **> 4** keep today’s generic lock / coming-soon path (no new combined gate in this slice).

5. **Challenge session win path**  
   After L3 win, open/navigate to Level 4 gate (paywall open today → gate). Do not imply payment completed.

### Client state

- Keep `isProctoredPaid` in store/progress for future real payment; **this slice does not set it true** from the Pay CTA.
- Remove or guard any UI that treats “unpaid at L4” as the only blocker and then allows start after demo pay.
- `applyChallengeResult` may still advance `campaignLevel` to 4 on L3 win (existing). Gate handles what happens next.

### Server

- Trials gate unchanged: cannot request level > campaign.
- Questions route: Level 4 with empty/unready pool → coming soon payload (existing).
- Optional hardening (recommended): for non-admin users, if `campaignLevel >= 4` and level 4 is not student-playable yet, refuse session start consistently — UI is primary; API remains source of truth for question load.
- No new payment tables or webhooks in this slice.

### Data flow (happy path)

```
Win L3 → campaignLevel becomes 4 → Challenge shows Level4Gate
     → Pay → PaymentWaitDialog → dismiss → still on gate
     → Back to Home → CTA reflects L4 gate (not Start play)
```

```
Admin at L4 + bank ready → Level4Gate + Preview
     → Preview → ChallengeSession(level 4) as today for testers
```

## Scenario matrix

| Scenario | Expected |
|---|---|
| On L1/L2/L3, open Home | No L4 pay/coming-soon tease |
| Win L3 | Gate appears (or next visit to `/challenge`) |
| Student Pay | Wait popup only; still unpaid; no session |
| Student refreshes at L4 | Gate again |
| Student deep-links questions API L4 | Coming soon / unavailable; no harvest |
| Fail L3 (trials left) | Stay on L3; no gate |
| Trials exhausted on L3 | Existing “no attempts” — never L4 |
| Daily lock after L3 win before L4 day | Existing IST daily lock still applies to *playing*; gate may still be viewable when they open challenge at L4 |
| Admin, no L4 bank | Gate + disabled/missing preview; Pay → wait popup |
| Admin, L4 bank ready | Gate + Preview starts session |
| Levels 5–10 | Unchanged beyond not auto-unlocking via demo Pay |
| Already `isProctoredPaid` from old demo | Prefer show gate until real payment product exists; do not auto-start L4. (If progress already paid, still no bank → coming soon / gate, not empty session.) |

## Error handling

- Missing class on L1–3 unchanged (`CLASS_LEVEL_REQUIRED` → sign-in), not this gate.
- Gate must not be classified as generic “coming soon” for lower levels.
- Wait popup must be dismissible; no stuck overlay without Back to Home.

## Testing / verification

1. **Unit:** gate visibility helpers (campaignLevel, isAdmin, bankReady); Pay does not flip paid; Home CTA copy/branch for L4 vs ≤3.
2. **Unit regression:** existing challenge `npm test` suite (level shape 10/20/30, class filter, trials) stays green — “double check L1–3.”
3. **Manual / smoke:** win path to L3 → gate; Pay → wait; admin preview only when bank ready.
4. **Out of scope for automated E2E** unless already harnessed: full win-through of three levels in browser.

## Out of scope

- Real Razorpay/Stripe (or any) checkout.
- Setting or syncing `is_proctored_paid` from a provider.
- Level 4 question bank authoring/seed.
- Level 4 round shape (card counts / groups) — decide when bank ships.
- Levels 5–10 combined gate.
- Push/email “notify when L4 live.”
- Splitting admin vs tester into two allowlists (admin = current allowlist).

## Approach chosen

**Approach 1:** Replace the demo paywall unlock with a dedicated Level 4 gate page (coming soon + pay → wait popup), admin dual path, L1–3 verification included.
