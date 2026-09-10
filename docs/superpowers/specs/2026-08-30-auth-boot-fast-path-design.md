# Fast auth boot for home (1M-user path)

Date: 2026-08-30

## Problem

Home was firing signed-in APIs (`/api/referral/mine`, `/api/college/applications?mine=1`, roster sync) while the Google session cookie was dead or never set. Each call ran `getUser()` against Auth and waited ~8–12s before returning **401**. Start Challenge felt slow because the page was blocked on those boot calls, not on questions.

401 means **not signed in**. It is not a broken Start button.

## Rules

- APIs return 401 immediately if the access JWT is missing or expired. Do not refresh tokens on API routes.
- Home does not fetch referral on mount. Referral loads when the student opens share/list.
- Student boot does not POST college roster sync. That stays a college-portal concern.
- College-role gate is cached 5 minutes in `sessionStorage` so every navigation is not a new Auth round trip.

## Success

Logged-out or stale-cookie home: availability 200, no 12s 401s, Start is clickable. Signed-in home: one progress fetch, Start uses shared availability cache.
