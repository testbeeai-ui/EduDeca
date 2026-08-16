# EduDeca Referral Codes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship `ED-{YY}…` referral codes, link-only attribution on signup, and a popup list of referred users on EduDeca home.

**Architecture:** TestBee Postgres owns codes + attributions via SECURITY DEFINER RPCs. EduDeca Next app mints codes on auth, captures `?ref=` via `/join` cookie, claims after login, and shows list on the home squad card.

**Tech Stack:** Next.js 16 (EduDeca), Supabase (shared TestBee), TypeScript.

---

### Task 1: Database migration

**Files:**
- Create: `Web/supabase/migrations/20261017120000_edudeca_referral_codes.sql`
- Apply on TestBee via MCP

**Step 1:** Add column, issued table, attributions table, allocate/ensure/claim RPCs, RLS select-own on attributions.

**Step 2:** Verify with SQL: allocate function returns `ED-26` + digit-first pattern; claim rejects self-ref.

---

### Task 2: Pure code helpers (EduDeca)

**Files:**
- Create: `EduDeca/lib/referral/referral-code.ts`
- Create: `EduDeca/lib/referral/pending-ref.ts`

Normalize/validate `ED-…`, cookie name helpers, share URL builder.

---

### Task 3: Join + claim + mine APIs

**Files:**
- Create: `EduDeca/app/join/page.tsx` (client capture → cookie via API or set cookie in route)
- Create: `EduDeca/app/api/referral/pending/route.ts` (SET/CLEAR cookie)
- Create: `EduDeca/app/api/referral/claim/route.ts`
- Create: `EduDeca/app/api/referral/mine/route.ts`
- Create: `EduDeca/lib/supabase/admin.ts` (service role optional; prefer user RPC for claim)

Prefer authenticated RPC for claim so service role is not required for happy path.

---

### Task 4: Auth hydrate mint + claim

**Files:**
- Modify: `EduDeca/components/shell/auth-gate.tsx`
- Modify: `EduDeca/store/useAppStore.ts` (optional referralCode in store)

After student code mint: `ensure_my_edudeca_referral_code`, then POST claim if pending cookie exists.

---

### Task 5: UI popup + share

**Files:**
- Modify: `EduDeca/components/home/squad-card.tsx` → referral card with click → dialog
- Create: `EduDeca/components/home/referral-list-dialog.tsx`
- Modify: `EduDeca/app/(app)/home/page.tsx` — fetch mine, wire share links to ED code URL

---

### Task 6: Smoke check

Sign-in path typechecks; `/join?ref=` redirects; mine returns empty list for new user.
