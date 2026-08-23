# EduDeca sign-in: class + college (mandatory)

**Status:** Approved (Approach 1)  
**Product:** EduDeca only  
**Date:** 2026-08-17

## Goal

On the final walkthrough step (Sign in), collect **Class 11 or Class 12** and **college name** before Google is clickable. Persist to the shared `profiles` row after Google succeeds, without disturbing Edubite / EduBlast flows.

## Decisions

| Topic | Choice |
|-------|--------|
| College input | Free text (not a catalog) |
| Storage | Shared `profiles.class_level` + `profiles.institution_name` |
| Pre-auth | Local only (Zustand persist) — no DB write without a user |
| Post-auth write | Fill **only if empty** — never overwrite existing values |
| Other apps | No UI/auth changes in Edubite or Web |
| Profile edit overwrite | Out of scope for this change (sign-in does not overwrite) |

## UX

1. On walkthrough **Sign in** step, above **Continue with Google**:
   - Class control: **Class 11** | **Class 12** (exactly one required)
   - Text input: **Which college are you from?** (required)
2. Google button is **disabled** until:
   - Class is `11` or `12`, and
   - College trimmed length ≥ 2
3. Existing gates stay: Decathlon lineup must still be complete before this step / Google
4. Copy stays EduDeca-styled; no new walkthrough step

## Architecture

```text
[Sign-in UI]
  → local signupClassLevel + signupCollege (Zustand persist)
  → isSignupProfileReady() gates Google button

[Google OAuth]  →  AuthGate hydrate
  → if local ready: read profiles.class_level, institution_name
  → UPDATE only columns that are NULL
  → never overwrite set values (Edubite/EduBlast safe)
```

### Modules (deep seams)

| Module | Responsibility |
|--------|----------------|
| `lib/signin/signup-profile.ts` | Pure: validate readiness; merge fill-if-empty patch |
| `components/signin/*` | UI: class toggle + college input; wire into `GoogleSignInForm` |
| `store/useAppStore` | Persist local class + college with walkthrough |
| `AuthGate` (or small client helper it calls) | After session: fill-if-empty `profiles` update |

Do **not** put merge/validation logic inside the OAuth button handler beyond calling the pure helpers.

## Data

- **Local:** `signupClassLevel: 11 | 12 | null`, `signupCollege: string`
- **Remote (existing columns):**
  - `profiles.class_level` — integer, nullable; write `11` or `12`
  - `profiles.institution_name` — text, nullable; write trimmed college string
- No new tables, RPCs, or migrations required

### Fill-if-empty rules

Given local ready values `L.class`, `L.college` and existing row `P`:

- If `P.class_level` is null → set to `L.class`; else leave
- If `P.institution_name` is null or blank → set to `L.college`; else leave
- If both already set → no update
- Independent per column (one may fill while the other is skipped)

## Non-goals

- Auto SSO across Edubite / EduBlast
- Overwriting existing shared profile fields from this sign-in screen
- College autocomplete / catalog
- Profile settings UI to edit class/college later
- Changing EduBlast or Edubite onboarding

## Testing

- Unit: `isSignupProfileReady` (empty / partial / valid)
- Unit: fill-if-empty merge (both empty, one set, both set, blank institution treated as empty)
- Manual: Google disabled until both filled; after first signup, profile columns set; second device/app with existing values does not get overwritten by EduDeca local answers

## Success criteria

- Investor sign-in step requires class + college before Google is clickable
- First-time users get `class_level` + `institution_name` on their shared profile after Google
- Existing non-null profile values are never overwritten by this flow
- Edubite / EduBlast auth and onboarding behavior unchanged
