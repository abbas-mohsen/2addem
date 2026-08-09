# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

npm workspaces monorepo. Run everything from the repo root.

```bash
npm install            # installs both workspaces
npm run seed:fresh     # wipe and rebuild demo data (see Demo data below)
npm run dev            # API on :4000 and Vite on :5173, together
npm test               # server API suite (see Tests below)
npm run lint           # eslint across both workspaces
npm run build          # production build of the client
npm run format         # prettier
```

`npm run seed` without `:fresh` is a no-op when demo data already exists, so it will not duplicate.

### Tests

`npm test` runs the server suite in `server/tests` on Node's built-in runner — no test framework
dependency. It covers auth and session lifetime, the profile endpoint, the ownership half of
authorisation, and the response envelope. **There are no client tests yet.**

The tests drive a real Express app on an ephemeral port over HTTP, against a real MongoDB. They are
not unit tests by design: this app's interesting behaviour lives in middleware ordering, cookies and
status codes, which in-process function calls would skip.

- `tests/helpers/env.mjs` is preloaded with `--import` so it beats `dotenv` to `process.env` —
  `dotenv` does not overwrite variables that are already set. It forces a `joinclone_test` database,
  disables email, and raises `AUTH_RATE_LIMIT`, which is what that knob is for. Do not add sleeps.
- `startTestServer()` **refuses to run unless the database name ends in `_test`**, because
  `resetDatabase()` empties every collection. Never remove that guard.
- Files run with `--test-concurrency=1`; they share one database and each wipes it in `before`.
- Fixtures go through `/auth/register` rather than writing documents directly, so the factories break
  if registration does.
- Node's runner treats *everything* under a directory named `test/` as a test file, which is why the
  directory is `tests/` and the script passes an explicit `tests/**/*.test.js` glob.

For UI work there is no committed harness; verification has been done with throwaway scripts driving
headless Edge over the Chrome DevTools Protocol. A few hard-won details if you write one:

- **Do not throttle the network to observe skeletons.** The Vite dev server ships hundreds of
  unbundled modules and each pays the added latency, so the app never boots inside the sample window.
  Use `Fetch.enable` to hold the API response open instead.
- Anchor CDP interception patterns to the origin root (`http://localhost:5173/api/*`). A bare
  `*/api/*` also matches Vite's own module paths like `/src/api/client.js` and blocks the app's
  JavaScript.
- Section headings are rendered uppercase by CSS, and `innerText` reflects that — match
  case-insensitively.
- React inputs ignore a plain `element.value = x`; go through the native setter and dispatch an
  `input` event, or the component's state never changes.

### Prerequisites

MongoDB on `127.0.0.1:27017`. Copy `server/.env.example` to `server/.env` before first run — the
server validates its environment with zod at boot and fails loudly on anything missing.

## Architecture

### Request flow

`routes → validate middleware → controller → service → model`

Controllers stay thin: they unwrap `req`, call a service, and hand the result to `sendData` /
`sendList`. Business rules and ownership checks live in `server/src/services`. Every response uses
one envelope — `{ success, data, meta? }` or `{ success: false, error: { message, code?, details? } }`
— and `asyncHandler` funnels rejections into the central error middleware, which normalises Mongoose,
multer and duplicate-key errors and never leaks stack traces in production.

Zod validates every write endpoint. `validate()` replaces `req.body`/`query`/`params` with the parsed
result, so handlers only ever see coerced, validated data. Express 5 exposes `req.query` via a getter,
which is why the middleware redefines the property rather than assigning to it.

### Auth

Access token in memory on the client, refresh token in an HTTP-only cookie scoped to `/api/auth`.
`User.tokenVersion` is bumped on logout and on admin deactivation, which invalidates outstanding
refresh tokens. Two consequences worth knowing before you change either:

- An **access token already in memory keeps working until it expires** — `requireAuth` does not
  compare its `version` claim against the user. Logout revokes the ability to renew, not the current
  token. This is the usual short-lived-token trade-off, and `tests/auth.test.js` pins it.
- **Deactivation is what ends a live session immediately**, and it does so through the `isActive`
  check in `requireAuth`, which reloads the user on every request — not through `tokenVersion`.

Authorisation is two layers, and both matter: `requireRole(...)` for the coarse check, then an
ownership lookup in the service (`findOwnedJob`, `findApplicationForRecruiter`, …) that scopes the
record to `req.user.company`. Admins bypass the ownership half. Never rely on the role check alone.

### Side effects never fail the request

Emails and in-app notifications are fire-and-forget. Callers do not await them and failures are
logged, not thrown — a mail outage must not turn a successful application into a failed request.

In development with `SMTP_HOST` empty, the app creates an Ethereal test inbox on first send and logs
a preview URL per message. Nothing reaches a real address until SMTP is configured.

### Client state

Server state is TanStack Query; auth is a Zustand store. There is no other global state — if you
reach for one, check whether a query key would do.

The axios instance holds the access token in a module variable (never `localStorage`) and refreshes
once on a 401 through a single shared in-flight promise, then retries the original request.

### i18n and RTL

English and Arabic, switchable at runtime. The i18n layer is a small custom module rather than
react-i18next; `Intl.PluralRules` handles Arabic's six plural categories, and plural dictionary
values are objects keyed by those categories.

Rules to keep working:

- **Never use physical direction utilities.** Use `ps-*`/`pe-*`, `ms-*`/`me-*`, `start-*`/`end-*`,
  `text-start`/`text-end`, `border-s`/`border-e`. Direction is one `dir` attribute, not a second
  stylesheet.
- Icons meaning *back* or *next* come from `components/ui/DirectionalIcon.jsx` so they flip. Icons
  meaning a thing (download, mail, star) do not flip.
- Enum labels, dates, salaries and relative times go through `useFormat()`, never hardcoded maps.
- Missing Arabic falls back to English; a **missing key throws in development**, so gaps surface in
  tests rather than shipping.
- Notifications are stored as a `type` plus `params`, not a baked sentence, so the bell renders them
  in the reader's language. `message` is the English fallback for older rows.
- Keep accessible names short and distinct from placeholders. Collapsing `aria-label` into the
  placeholder key has already caused one regression.

### Loading states

Skeletons shaped like the content they replace (`components/ui/Skeletons.jsx`), never a full-page
spinner — the only spinner left in the app is inside a pending `Button`. A delayed top progress bar
covers mutations and background refetches.

### Storage

Resume uploads go through `services/storage.service.js`, which exposes keys and public URLs so the
local-disk driver can be swapped for S3 without touching controllers. Multer never trusts the
client-supplied filename; only the extension survives.

## Market-specific behaviour

Built for the Lebanese market, and these are deliberate product decisions, not placeholders:

- Salaries carry a `freshUsd` flag and render as `$36,000 – $54,000 fresh`. Since 2019 the lira is
  not how pay is quoted here and plain "dollars" is ambiguous.
- `remoteAbroad` (remote work paid from outside the country) is its own filter, distinct from
  `remote`. It is the filter candidates use most.
- `freelance` is a first-class employment type, not a flavour of contract.
- `GET /api/meta/locations` serves Lebanese governorates and cities for autocomplete; the location
  field itself stays free text.

## Deliberate non-features

Do not "finish" these without asking — they are scoped out on purpose:

- **The AI job-ad builder is a stub.** `server/src/services/ai.service.js` makes no network call and
  contains no model logic; it assembles a local template. The UI labels it "Stub" and shows a
  disclaimer on every draft. The file documents exactly what to replace to wire up a real API.
- No multiposting to external job boards, no payments.
- Server validation messages stay English. The client mirrors each rule and shows its own translated
  message first; the server copy is the backstop.

## Destructive-action policy

The codebase consistently prefers closing over deleting, because applications are candidates'
records too:

- Deleting a job that has applicants closes it instead.
- Admin takedown closes a job and notifies its author; deletion is refused outright when anyone has
  applied.
- Admins cannot deactivate themselves or other admins.

## Demo data

`npm run seed:fresh` builds three companies, seven jobs, nine applications, interviews, a talent pool
and notifications. Every account uses the password `password123`:

| Email                   | Role      |
| ----------------------- | --------- |
| `admin@2addem.dev`      | admin     |
| `recruiter1@2addem.dev` | recruiter (Cedarline — busiest pipeline) |
| `candidate1@2addem.dev` | candidate (at interview stage) |

Admins are only ever created by the seed script — public registration rejects the `admin` role.

## Gotchas

- **Nodemon does not watch `.env`.** Changing it requires a manual restart, and a stale server
  process holding port 4000 will silently shadow a new one.
- The client dev server proxies `/api` and `/uploads` to :4000, which keeps the refresh cookie
  same-origin. Do not add absolute API URLs.
- `step` on a numeric input must divide evenly from `min`, or the browser silently refuses to submit
  with no visible error. This has bitten the interview duration and salary fields.
