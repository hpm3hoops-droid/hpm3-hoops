# HPM3 Hoops

Helping Players Master · Maximize · Multiply. Remote basketball development for middle and high school players: a daily plan engine, Saturday benchmarks with automatic level-ups, weekly film study, group calls by track, a coach dashboard, Stripe checkout, and missed-day accountability emails.

Stack: Next.js 15 · React 19 · Drizzle ORM · Postgres · Stripe · Nodemailer. Deployed on Railway (project `hpm3-hoops`, service `web`); migrations and the starter seed run automatically on start.

## Routes

| Area | Route | Who |
|---|---|---|
| Landing + pricing | `/` | public |
| Join (Stripe) or spot request (Stripe off) | `/join/cohort` `/join/core` `/join/elite` | public |
| Magic-link sign-in | `/login` → `/auth/verify` | everyone |
| Onboarding | `/onboarding` | athlete |
| Today's session, benchmarks, film, calls, progress, clips | `/app/*` | athlete |
| Roster, athlete detail, drills, film modules, calls, inbox, requests, settings | `/coach/*` | coach (COACH_EMAILS) |
| Stripe webhook | `POST /api/stripe/webhook` | Stripe |
| Daily nudge (also runs internally at 09:00 ET) | `GET /api/cron/nudge?key=CRON_SECRET` | cron |
| Health | `/api/health` | Railway |

## Environment

See `.env.example`. Required: `DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, `COACH_EMAILS`. Email needs `SMTP_*` (a Gmail App Password works). Stripe is optional — without it the join page collects requests that the coach approves in `/coach/leads`.

## Local

```bash
cp .env.example .env
npm install
npm run db:migrate && npm run db:seed
npm run dev
```

## Engine (src/lib/program.ts)

Day kinds: Sun rest · Sat benchmark · Wed film · in-season practice days = optional touch-up · else skill day. Tryout Prep ramps 15 → 30 → 45 → 60 min by week; Rebuild 30 → 45 → 60; In-season stays at 30. Sessions are assembled from the drill library per block and level, rotated daily, with no-hoop variants. Two consecutive benchmarks over the threshold = level up. Two missed scheduled days = email to athlete and parent.
