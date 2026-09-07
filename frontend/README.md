# Weekly Report Generator — Frontend

Next.js (App Router) frontend for the Weekly Report Generator & Team Dashboard.
Team members create and submit structured weekly reports; managers review them,
request corrections, and track the whole team from a dashboard with charts and
an AI chat assistant.

This repo is the frontend only. It talks to a separate FastAPI backend — see
`../weekly-report generator-backend` — over a REST API; there is no database
access from this repo.

## Stack

- Next.js 16 (App Router, Server Components + Server Actions), React 19
- TypeScript, Tailwind CSS
- Recharts for the manager insights dashboard
- Sessions: httpOnly cookies holding the backend's JWT access/refresh tokens
  (see `src/lib/session.ts`); every backend call is proxied server-side, so
  tokens are never exposed to the browser

## 1. Install dependencies

Requires Node.js 20+.

```bash
npm install
```

## 2. Configure environment variables

Create `.env.local` in this directory (already present locally, not committed):

```bash
# Base URL of the backend API, including its version prefix.
BACKEND_API_URL=http://127.0.0.1:8000/api/v1

# Set to "1" once the app is served over HTTPS so session cookies are marked
# Secure. Leave unset (or "0") for local http:// development.
COOKIE_SECURE=0
```

`BACKEND_API_URL` must point at a running instance of the backend (see below).

## 3. Run the backend and its database first

This app has no functionality without the backend. In a sibling checkout of
the backend repo, follow its README to:

1. start/point at its MongoDB instance, and
2. run the FastAPI server (default `http://127.0.0.1:8000`).

Optionally run its `scripts/seed_demo.py` to get a multi-week, multi-status,
multi-member dataset to browse (several team members, managers, projects, and
reports across Draft/Submitted/Needs Correction/Approved).

## 4. Run the frontend

```bash
npm run dev
```

Open http://localhost:3000. Sign in with a seeded account from the backend
(e.g. `manager@example.com` / `member@example.com`, see the backend README for
current seed credentials), or register a new account.

Other scripts:

```bash
npm run build   # production build
npm run start   # run the production build (after `build`)
npm run lint    # ESLint
```

## Project structure

- `src/app` — routes (App Router), grouped under `(app)` for the authenticated
  shell (dashboard, reports, projects, admin, reviews) plus top-level
  `login`/`register` pages.
- `src/components` — feature components (report form, review panel, team
  dashboard, insights charts, chat widget, admin/user management, …) and
  `src/components/ui` for shared primitives (button, card, dialog, table, …).
- `src/lib` — server-only data-fetching (`reports.ts`, `projects.ts`,
  `users.ts`, `dashboard.ts`), Server Actions (`*-actions.ts`), session/auth
  helpers (`session.ts`), the fixed report schema and validation
  (`report-schema.ts`, `validation.ts`), and shared types mirroring the
  backend's response models (`types.ts`).
- `src/proxy.ts` — Next.js middleware: renews the access token from the
  refresh token on navigation, and enforces route-level auth/role guards
  (e.g. `/reviews/*`, `/admin`, `/projects` require a Manager).

## Key pages

| Route | Purpose |
|---|---|
| `/login`, `/register` | Auth |
| `/dashboard` | Team member home |
| `/dashboard/reports`, `/dashboard/reports/new`, `/dashboard/reports/[id]` | Own report history, create, and edit/view |
| `/reviews` | Manager team dashboard — filter/track submissions across the team |
| `/reviews/[id]` | Manager review page — Approve / Request Changes |
| `/reviews/members/[userId]` | Manager view of one team member's full report history and stats |
| `/reviews/insights` | Charts and summary metrics (submission compliance, workload, hours by task type, activity feed) |
| `/projects` | Project/category management (CRUD, member assignment) |
| `/admin` | User management (invite, remove, assign roles) |
| `/account` | Account settings |

## Tests

No frontend test suite is included; automated tests (including role-based
access control) live in the backend repo (`tests/`).
