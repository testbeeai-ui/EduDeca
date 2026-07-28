# EduDeca

Premium web app for EduDeca — a gamified learning platform for Class XI & XII students.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Framer Motion (page transitions, spring UI, stagger)
- Lenis (smooth scrolling)
- NumberFlow (animated counters)
- Zustand (client state)

## Pages

| Route | Description |
|-------|-------------|
| `/home` | Student dashboard |
| `/signin` | 6-step walkthrough + phone OTP sign-in |
| `/levels` | Level path timeline |
| `/leaderboard` | Students & colleges rankings |
| `/rewards` | Prizes, badges, and unlocks |

## Run

```bash
npm install
npm run dev
```

Opens at [http://localhost:3001](http://localhost:3001) (port 3001 to avoid conflict with the main Web app on 3000).

## Notes

- Google OAuth via Supabase (same TestBee project as Edubite)
- Dark mode first
- Built for product storytelling and daily learning flow

### Supabase Auth redirect URLs

Add these in Supabase → Authentication → URL Configuration → Redirect URLs:

- `http://localhost:3001/auth/callback`
- `https://<your-edudeca-domain>/auth/callback`
