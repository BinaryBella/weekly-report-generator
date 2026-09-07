# Weekly Report Generator

A team weekly-reporting tool. Team members write and submit structured weekly
reports; managers review them, approve or request changes, and track the whole
team from a dashboard with charts and an AI chat assistant.

This repository holds two apps that run together:

| Directory   | What it is                | Stack                                        |
|-------------|---------------------------|----------------------------------------------|
| `backend/`  | REST API                  | FastAPI + Pydantic v2, MongoDB (Motor/Beanie), JWT auth |
| `frontend/` | Web app (talks to the API)| Next.js 16 (App Router), React 19, TypeScript, Tailwind, Recharts |

The frontend has no database access of its own — every request is proxied
server-side to the backend, which owns MongoDB and all auth tokens.

---

## Prerequisites

- **Node.js 20+** and npm — for the frontend
- **Python 3.12+** — for the backend
- **[uv](https://docs.astral.sh/uv/)** — the backend's package manager
  (`pipx install uv` or see the uv docs)
- **MongoDB** — either a local server or a free MongoDB Atlas cluster

---

## 1. Backend

All commands below run from `backend/`.

```bash
cd backend
```

### 1.1 Install dependencies

```bash
uv sync           # creates .venv and installs runtime + dev dependencies
```

### 1.2 Configure environment

```bash
cp .env.example .env
```

Then edit `.env`. The two values you must set are `MONGODB_URI` and
`JWT_SECRET_KEY`.

| Variable                              | Default                     | Notes |
|---------------------------------------|-----------------------------|-------|
| `MONGODB_URI`                         | `mongodb://localhost:27017` | Local URI or an Atlas `mongodb+srv://…` string |
| `MONGODB_DB_NAME`                     | `weekly_report`             | Created on first write |
| `MONGODB_SERVER_SELECTION_TIMEOUT_MS` | `5000`                      | How long to wait for a server before failing |
| `JWT_SECRET_KEY`                      | *(change me)*               | HS256 signing key — use ≥ 64 random chars |
| `JWT_ALGORITHM`                       | `HS256`                     | |
| `ACCESS_TOKEN_EXPIRE_MINUTES`         | `15`                        | Access-token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS`           | `7`                         | Refresh-token lifetime |
| `BOOTSTRAP_ADMIN_EMAILS`              | *(empty)*                   | Comma-separated emails granted the Admin role (see below) |
| `CORS_ALLOW_ORIGINS`                  | `*`                         | Comma-separated origins; keep `http://localhost:3000` for local dev |

Generate a secret key:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### 1.3 Get a MongoDB

**Option A — local via Docker:**

```bash
docker run -d --name mongo -p 27017:27017 mongo:7
# .env:  MONGODB_URI="mongodb://localhost:27017"
```

**Option B — MongoDB Atlas (hosted, free M0):**

1. Create an **M0** cluster at <https://cloud.mongodb.com>.
2. **Database Access** → add a database user (username + password).
3. **Network Access** → add your current IP (or `0.0.0.0/0` for quick testing).
4. **Connect → Drivers** → copy the `mongodb+srv://…` string into `.env`,
   URL-encoding special characters in the password
   (`@`→`%40`, `:`→`%3A`, `/`→`%2F`, `#`→`%23`):

   ```
   MONGODB_URI="mongodb+srv://appuser:My%40Pass@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=cluster0"
   MONGODB_DB_NAME="weekly_report"
   ```

`mongodb+srv://` URIs use TLS and the app pins `certifi`'s CA bundle
automatically. On startup the app pings the cluster and, if it is unreachable,
exits with a one-line reason (bad URI, IP not allow-listed, wrong credentials)
instead of a driver traceback.

### 1.4 Run

```bash
uv run uvicorn app.main:app --reload
```

- API base URL: `http://127.0.0.1:8000`
- Interactive docs: <http://127.0.0.1:8000/docs>
- Health probe: <http://127.0.0.1:8000/health> → `{"status":"ok"}`

### 1.5 Bootstrapping the first Admin

Self-registration **always** creates a `Team Member` — a client cannot request a
privileged role. To seed the first `Admin`, put their email in
`BOOTSTRAP_ADMIN_EMAILS` before they register (or restart the server after
adding it to promote an existing account). From there an Admin promotes others
via `PATCH /api/v1/users/{id}/role`.

### 1.6 Tests

```bash
uv run pytest
```

The suite runs against an in-memory MongoDB (`mongomock-motor`) — no running
database required.

---

## 2. Frontend

All commands below run from `frontend/`.

```bash
cd frontend
```

### 2.1 Install dependencies

```bash
npm install
```

### 2.2 Configure environment

Create `frontend/.env.local`:

```bash
# Base URL of the backend API, including its version prefix.
BACKEND_API_URL=http://127.0.0.1:8000/api/v1

# Set to "1" only when the app is served over HTTPS (marks session cookies
# Secure). Leave as "0" for local http:// development.
COOKIE_SECURE=0
```

`BACKEND_API_URL` must point at a running backend (section 1). Both variables
are read server-side only; nothing here is shipped to the browser.

### 2.3 Run

```bash
npm run dev
```

Open <http://localhost:3000>. Register a new account, or sign in with a seeded
one. The first account whose email is in the backend's `BOOTSTRAP_ADMIN_EMAILS`
becomes an Admin.

Other scripts:

```bash
npm run build   # production build
npm run start   # serve the production build (after build)
npm run lint    # ESLint
```

---

## 3. Running the full stack

Start the backend first, then the frontend, in two terminals:

```bash
# terminal 1
cd backend && uv run uvicorn app.main:app --reload

# terminal 2
cd frontend && npm run dev
```

Then:

1. Go to <http://localhost:3000/register> and create an account. Use an email
   listed in the backend's `BOOTSTRAP_ADMIN_EMAILS` if you want an Admin.
2. Sign in. Team members land on `/dashboard`; managers/admins can reach
   `/reviews`, `/reviews/insights`, `/projects`, and `/admin`.

### Key frontend routes

| Route | Purpose |
|---|---|
| `/login`, `/register` | Auth |
| `/dashboard` | Team-member home |
| `/dashboard/reports`, `/dashboard/reports/new`, `/dashboard/reports/[id]` | Own report history, create, edit/view |
| `/reviews` | Manager team dashboard — filter/track submissions |
| `/reviews/[id]` | Manager review page — Approve / Request Changes |
| `/reviews/members/[userId]` | One member's full history and stats |
| `/reviews/insights` | Charts and summary metrics |
| `/projects` | Project/category management (Manager) |
| `/admin` | User management — invite, remove, assign roles (Admin) |
| `/account` | Account settings |

### Backend API

Base prefix: `/api/v1`. Auth endpoints under `/auth`
(`/register`, `/login`, `/refresh`, `/logout`, `/me`), user management under
`/users`. Full schemas at <http://127.0.0.1:8000/docs>.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Backend exits on startup with a MongoDB message | Check `MONGODB_URI`, that the DB is running, and (Atlas) that your IP is allow-listed |
| Frontend loads but every action fails / login hangs | Backend not running, or `BACKEND_API_URL` wrong / missing the `/api/v1` suffix |
| Browser CORS errors | Add `http://localhost:3000` to the backend's `CORS_ALLOW_ORIGINS` |
| Logged out immediately after signing in | `COOKIE_SECURE=1` while serving over plain `http://` — set it to `0` |
| `uv: command not found` | Install uv (`pipx install uv`) and reopen the shell |
