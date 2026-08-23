# EduDeca referral codes — design

**Status:** Approved (Approach 2)  
**Product:** EduDeca only  
**Date:** 2026-08-17

## Goal

Each EduDeca user gets a shareable referral code `ED-26…`. Friends who open the invite link and sign in are attributed to that referrer. Tapping the home referral/squad card opens a popup listing who joined via their code (count + names/avatars).

## Decisions

| Topic | Choice |
|-------|--------|
| Product | EduDeca only |
| Code vs Student ID | Separate: Student ID `EB-…`, referral `ED-…` |
| Patterns | Different so they never match |
| Attribution moment | Signup / first sign-in |
| Apply method | Link only (`/join?ref=ED-…`) |
| Storage | Own tables on shared TestBee Supabase |

## Code format

- **Student ID (unchanged):** `EB-{YY}{L}{D}{L}{D}{L}{D}` e.g. `EB-26K7M2Q9`
- **Referral:** `ED-{YY}{D}{L}{D}{L}{D}{L}{D}{L}` e.g. `ED-267K2M9Q4A`
  - `{YY}` = IST calendar year mod 100 (`26` for 2026)
  - Suffix is **digit-first**, then letter/digit alternating (8 chars after year)
  - Capacity ≈ 1.2e9 codes/year — enough for millions of users
  - Regexes do not overlap with Student ID

## Data model

1. `edudeca_referral_codes_issued` — uniqueness claim table (like `student_id_issued`)
2. `profiles.edudeca_referral_code` — nullable text, unique when set
3. `edudeca_referral_attributions` — one row per referee
   - `referrer_user_id`, `referee_user_id` (unique), `ref_code`, `credited_at`
4. RPCs (SECURITY DEFINER):
   - `allocate_edudeca_referral_code()`
   - `ensure_my_edudeca_referral_code()` — authenticated
   - `claim_edudeca_referral_attribution(p_ref_code)` — referee = `auth.uid()`, no self-ref, first claim wins

## Flows

### Mint

On EduDeca auth hydrate (alongside student code): call `ensure_my_edudeca_referral_code`.

### Share

Copy/WhatsApp link: `{origin}/join?ref={ED-code}`

### Capture + claim

1. `/join?ref=…` validates code, sets httpOnly cookie `edudeca_pending_ref`, redirects `/signin`
2. After OAuth callback / session ready, client or server calls claim API / RPC with pending cookie
3. Clear cookie; row appears in referrer’s list

### Popup list

GET `/api/referral/mine` → `{ code, shareUrl, count, entries: [{ id, name, initials, creditedAt }] }`  
Squad/referral card shows count + avatar stack; click opens dialog with full list + copy link.

## Non-goals (this slice)

- Squad/group formation beyond “people I referred”
- XP/RDM grant (can hook later; attribution is source of truth)
- Manual code entry
- Changing EduBlast hex referral system

## Security

- Claim only for `auth.uid()` as referee
- Cannot refer yourself
- One attribution per referee forever
- Lookup by unique code index; no sequential guessing advantage (random allocation)
