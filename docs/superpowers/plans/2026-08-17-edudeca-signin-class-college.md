# EduDeca sign-in class + college Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require Class 11/12 + free-text college on EduDeca sign-in before Google is clickable; fill shared `profiles` only if empty after OAuth.

**Architecture:** Pure `lib/signin/signup-profile.ts` for readiness + fill-if-empty merge. Zustand persists local answers. `GoogleSignInForm` gates the button. `AuthGate` writes fill-if-empty after session. EduDeca profile UI prefers store over mock.

**Tech Stack:** Next.js 16, React 19, Zustand persist, Supabase JS, `npx tsx` scenario scripts (no vitest).

## Global Constraints

- EduDeca only — do not change Edubite or Web
- Free-text college; class exactly 11 or 12
- Pre-auth: local only
- Post-auth: fill only if empty — never overwrite
- No new tables/migrations
- Google disabled until class set and college trim length ≥ 2

## File map

| File | Role |
|------|------|
| `lib/signin/signup-profile.ts` | Pure readiness + fill-if-empty patch |
| `scripts/test-signup-profile.ts` | Unit scenario script |
| `store/useAppStore.ts` | Persist `signupClassLevel`, `signupCollege` |
| `components/signin/google-sign-in.tsx` | Class + college UI + disable Google |
| `lib/signin/sync-signup-profile.ts` | Client: read profiles → fill-if-empty update |
| `components/shell/auth-gate.tsx` | Call sync after session |
| `app/(app)/profile/page.tsx` + `profile-menu.tsx` | Show store class/college over mock |

---

### Task 1: Pure signup-profile module + tests

**Files:**
- Create: `lib/signin/signup-profile.ts`
- Create: `scripts/test-signup-profile.ts`

**Interfaces:**
- Produces: `SignupClassLevel`, `isSignupProfileReady(classLevel, college)`, `buildFillIfEmptyProfilePatch(local, existing)`

- [ ] **Step 1:** Write failing scenario script covering ready/partial/empty and fill-if-empty cases
- [ ] **Step 2:** Implement `lib/signin/signup-profile.ts` until `npx tsx scripts/test-signup-profile.ts` passes
- [ ] **Step 3:** Commit

### Task 2: Store + Google sign-in UI gate

**Files:**
- Modify: `store/useAppStore.ts`
- Modify: `components/signin/google-sign-in.tsx`

- [ ] **Step 1:** Add `signupClassLevel`, `signupCollege`, setters; partialize persist; clear on signOut with lineup
- [ ] **Step 2:** Add Class 11/12 control + college input above Google; disable until `isSignupProfileReady`; block click if not ready
- [ ] **Step 3:** Commit

### Task 3: Post-auth fill-if-empty sync

**Files:**
- Create: `lib/signin/sync-signup-profile.ts`
- Modify: `components/shell/auth-gate.tsx`

- [ ] **Step 1:** Client helper: if local ready, select profiles columns, apply patch, update only empties; hydrate store from existing profile values when local empty
- [ ] **Step 2:** Call from auth hydrate path alongside progress sync
- [ ] **Step 3:** Commit

### Task 4: Profile display + verify

**Files:**
- Modify: `app/(app)/profile/page.tsx`
- Modify: `components/shell/profile-menu.tsx`

- [ ] **Step 1:** Prefer store class/college labels over `currentUser` mock
- [ ] **Step 2:** Run scenario script + `npx tsc --noEmit` (or build) in EduDeca
- [ ] **Step 3:** Commit
