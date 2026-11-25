# AbleSprout UI

The web app for **AbleSprout**, an AI-powered Inclusive Education OS for Indian schools. *Support for every learner.*

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) · lucide-react · TanStack Query · React Hook Form + Zod · Recharts · next-intl (English + हिन्दी) · Playwright.

It talks to the AbleSprout REST API (the `ablesprout-api` repo), which serves everything under `/api/v1`.

---

## Setup

Requires Node 20.9+.

```bash
npm install
```

```bash
cp .env.example .env.local
```

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | yes | API origin without `/api/v1`, e.g. `http://localhost:4000` or `https://ablesprout-api.vercel.app` |
| `API_URL` | no | Server-side URL for the API, if it differs from the public one |
| `PROXY_SHARED_SECRET` | recommended | Same value as the API's `PROXY_SHARED_SECRET`. Lets the API rate-limit logins by the real client IP |
| `PILOT_WEBHOOK_URL` | no | Where "Become a pilot school" submissions are POSTed (Slack, Zapier, Formspree…). If unset, they go to the server log |

Then start the dev server:

```bash
npm run dev
```

The app runs at http://localhost:3000. The API's `FRONTEND_URL` must include this origin (CORS).

| Script | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev server, production build, and production server |
| `npm run typecheck` / `lint` | TypeScript and ESLint |
| `npm run check:i18n` | Fails if any `t("…")` key is missing from `messages/en.json` or `messages/hi.json` |
| `npm run test:e2e` | Playwright smoke tests (see below) |

---

## Demo walkthrough

Seed the API first (`npm run seed` in `ablesprout-api`). Every demo account's password is **`Demo@12345`**.

1. **School leader**: `admin@sunrise.example`
   - The **Dashboard** shows KPI cards: students, % with an approved IEP, reviews due, and average goal progress.
   - It also has a chart of students by support need, a goal-status donut, progress by domain, and an educator activity table.
   - On **Team**, invite an educator or parent. Leave the password blank to get a one-time temporary password. Then use **Assign to students**.
2. **Special educator**: `kavya@sunrise.example`
   - The dashboard has quick actions (New assessment · Generate IEP · Create worksheet), my students, IEPs due soon, and recent progress.
   - Open **Vihaan Reddy** and go to **IEP**. Click **Generate with AI** and watch the "Drafting IEP goals…" state. The draft carries the badge *"AI draft — educator has the final say"*.
   - Edit the present levels or any goal inline. You can add or remove goals. Click **Save changes**, then **Approve IEP** and confirm. **Download PDF** exports the plan.
   - On **Progress**, use **Log progress** to add a 0–100 value and a note. The line chart updates immediately.
   - Open **Aarav Sharma** and go to **Worksheets**. Enter a subject and topic, tick adaptations, then **Generate worksheet**. You can edit the result, open the **Print view**, **Download PDF**, or **Share with parent**.
   - **Adapt existing worksheet**: paste textbook text, pick a learner profile, and compare the before/after split view.
   - **Messages** is a chat thread with the parent. You can attach a worksheet as a home activity.
3. **Parent**: `sunita@parent.example` (Hindi preferred, so the UI switches to हिन्दी after login)
   - The dashboard shows a child card, goal progress bars, latest messages, and shared home activities.
   - Everything is read-only except messaging. Draft IEPs are never shown to parents.

Try the **Accessibility** button in the header (larger text, dyslexia-friendly Lexend font) and the **EN / हिं** switch.

> Without an AI key, run the API with `LLM_PROVIDER=mock` to get deterministic demo drafts.

---

## Architecture

```
app/
  page.tsx                      landing page (server-rendered, translated)
  login/, register-school/      auth pages
  api/auth/[action]/route.ts    login · register-school · refresh · logout proxy (sets httpOnly cookie)
  api/pilot/route.ts            pilot-school form → PILOT_WEBHOOK_URL
  app/                          signed-in area (AuthProvider + role-aware AppShell)
    dashboard/  students/  students/[id]/  team/  settings/  worksheets/[id]/print/
components/
  ui/            shadcn/ui primitives (+ native-select, native input/textarea)
  layout/        app shell, language switcher, accessibility toggle
  dashboard/     admin / educator / parent dashboards
  students/      list, form dialog, profile tabs (overview, assessments, iep, progress, worksheets, messages)
  iep/ worksheets/ team/ charts/ common/ providers/ auth/ landing/
hooks/queries.ts     TanStack Query hooks
lib/api/             typed client: one function per endpoint (endpoints.ts), auth.ts, client.ts, errors.ts
types/api.ts         shared API types
messages/en.json, messages/hi.json
middleware.ts        protects /app, role redirects
e2e/                 Playwright smoke tests
```

### Auth model

- The **access token** (1h) lives only in memory (`lib/auth/token-store.ts`). It is never written to localStorage.
- The **refresh token** (7d) is stored in an `httpOnly`, `SameSite=Lax`, `Secure` cookie. Only the same-origin route handlers in `app/api/auth/*` read or set it. Those handlers proxy to the API server-to-server.
- On load, or on a 401, the client calls `/api/auth/refresh`. The API rotates refresh tokens, and reusing one revokes every session. To avoid tripping that by accident, refreshes are de-duplicated within a tab and serialised across tabs with the Web Locks API.
- `middleware.ts` redirects signed-out users to `/login?next=…`, sends signed-in users away from `/login`, and keeps non-admins out of `/app/team`. It uses an `httpOnly` role cookie for this. The UI also hides actions a role can't perform (`<RoleGate>`). The **API remains the source of truth** for authorisation.

### Accessibility and low bandwidth

- WCAG 2.1 AA colour pairs, 3px focus rings, a skip link, labelled controls, `aria-live` for AI progress and chat, and keyboard-operable menus, dialogs and tabs. Text is never smaller than 16px, and touch targets are at least 44px.
- **Accessibility toggle**: larger text (≈19px base) and the Lexend dyslexia-friendly font with wider spacing. It's saved per device and applied before first paint.
- **Low bandwidth**:
  - Fonts are self-hosted via `next/font`.
  - Charts are lazy-loaded.
  - There are no raster images; the logo is inline SVG.
  - `<select>` and checkboxes are native, so phones use the OS picker.
  - Skeleton loaders show while data loads, and query caching avoids refetches.
  - Message sending, progress logging and goal-status changes are optimistic.
- The worksheet print view honours the learner's adaptations: dyslexia font with cream paper, large print, chunked steps, picture boxes, extra spacing, and high contrast. The PDF download applies the same adaptations on the server.

---

## Playwright smoke tests

These cover: landing page, sign-in redirect, login for each role and their dashboards, role guards, sign-out, AI IEP generate → edit → approve, and worksheet generate → share → print view. They run on a Pixel 7 profile and on desktop Chrome.

1. Start the API with the demo seed and the mock AI provider:

   ```bash
   cd ../ablesprout-api && npm run seed && LLM_PROVIDER=mock API_RATE_LIMIT=5000 AUTH_RATE_LIMIT=500 FRONTEND_URL=http://localhost:3100 npm run dev
   ```

2. In this repo, install the browser once:

   ```bash
   npm run test:e2e:install
   ```

3. Run the tests. This builds and starts the UI on :3100:

   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:4000 npm run test:e2e
   ```

The AI test creates a new approved IEP for Vihaan on every run. Re-seed the API to reset the data. The raised rate limits stop repeated runs from localhost being throttled. To test a deployed UI, set `E2E_BASE_URL=https://…`.

---

## Deploying both repos on Vercel

1. **API** (`ablesprout-api`): import the repo into Vercel. `vercel.json` routes every request to the serverless Express handler in `api/index.ts`. Set its environment variables:
   - `MONGODB_URI` (MongoDB Atlas; transactions need a replica set, which Atlas always has)
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
   - `LLM_PROVIDER`, `LLM_API_KEY`
   - `PROXY_SHARED_SECRET`
   - `FRONTEND_URL` = your UI URL(s). Comma-separate several, and use `*` for previews, e.g. `https://ablesprout-ui.vercel.app,https://ablesprout-ui-*.vercel.app`

   In Atlas, allow Vercel to connect (Network Access, e.g. `0.0.0.0/0` with a strong DB password).
2. **UI** (`ablesprout-ui`): import the repo into Vercel; the Next.js framework is auto-detected. Set `NEXT_PUBLIC_API_URL` to the API's Vercel URL, and set `PROXY_SHARED_SECRET` to the same value as the API's.
3. Seed once from your machine against Atlas:

   ```bash
   MONGODB_URI=… npm run seed
   ```

   Run it in `ablesprout-api`.

`NEXT_PUBLIC_*` values are baked in at build time, so redeploy the UI after changing `NEXT_PUBLIC_API_URL`.
