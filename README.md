# 2addem · قدّم

A two-sided hiring platform in the MERN stack, modelled on join.com. Candidates browse a public
job board and apply with a resume; recruiters publish roles and work applicants through a pipeline.

The name is the Levantine imperative **قدّم** — *"apply"* — written the way Lebanese actually type
it, with `2` standing in for the glottal ق. The mark is that `2` with its base stroke running out
into an arrow; the root ق-د-م means *to step forward*.

> Status: **Phases 1–3 complete.** Auth, job board, applications, a drag-and-drop ATS pipeline,
> dashboards, email and in-app notifications, interview scheduling, a talent pool and an admin
> moderation panel all work end to end. Run `npm run seed:fresh` for demo data and log in with the
> accounts below. See [Roadmap](#roadmap) for what is deliberately left out.

---

## Stack

| Layer    | Choice                                                                                |
| -------- | ------------------------------------------------------------------------------------- |
| API      | Node + Express 5, ES modules, Mongoose 8, Zod validation, JWT, multer, nodemailer       |
| Client   | React 19 + Vite 7, React Router 7, TanStack Query, Zustand, Tailwind CSS 4, dnd-kit     |
| Database | MongoDB                                                                                |

---

## Requirements

- Node.js **20.19+** (built and tested on 22)
- MongoDB running locally, or a MongoDB Atlas connection string

---

## Setup

```bash
git clone <your-repo-url> joinclone
cd joinclone
npm install                       # installs both workspaces

cp server/.env.example server/.env
cp client/.env.example client/.env   # optional, see below
```

Open `server/.env` and set at minimum `MONGODB_URI` and the two JWT secrets.

### Run it

```bash
npm run seed:fresh     # wipe and load demo data (optional but recommended)
npm run dev            # API on :4000 and client on :5173, together
```

### Demo accounts

`npm run seed:fresh` builds three companies, seven jobs, nine applications, interviews, a talent
pool and notifications. Every account uses the password `password123`:

| Email                   | Role      | What they show                                    |
| ----------------------- | --------- | ------------------------------------------------- |
| `admin@2addem.dev`      | admin     | Moderation panel with every user, job and company  |
| `recruiter1@2addem.dev` | recruiter | Cedarline — busiest pipeline, talent pool, stats   |
| `recruiter2@2addem.dev` | recruiter | Manara Labs — remote roles                         |
| `candidate1@2addem.dev` | candidate | Lara — at interview stage, with a booked interview |
| `candidate2@2addem.dev` | candidate | Karim — has an offer                               |

`npm run seed` (without `:fresh`) is a no-op if demo data already exists, so it will not duplicate.

Or separately:

```bash
npm run dev:server
npm run dev:client
```

Then open <http://localhost:5173>.

Vite proxies `/api` and `/uploads` to the API in development, so the browser stays on one origin
and the HTTP-only refresh cookie works without any cross-site cookie setup.

### Other scripts

```bash
npm run build     # production build of the client
npm run lint      # eslint across both workspaces
npm run format    # prettier
```

---

## Environment variables

### `server/.env`

| Variable                              | Default                                 | Notes                                                     |
| ------------------------------------- | --------------------------------------- | --------------------------------------------------------- |
| `NODE_ENV`                            | `development`                           | `development` \| `test` \| `production`                    |
| `PORT`                                | `4000`                                  | API port                                                   |
| `CLIENT_URL`                          | `http://localhost:5173`                 | CORS origin                                                |
| `MONGODB_URI`                         | —                                       | **Required**                                               |
| `JWT_ACCESS_SECRET`                   | —                                       | **Required**, min 16 chars                                 |
| `JWT_REFRESH_SECRET`                  | —                                       | **Required**, min 16 chars, must differ from the above     |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL`  | `15m` / `30d`                           | Token lifetimes                                            |
| `STORAGE_DRIVER`                      | `local`                                 | Only `local` today; the seam for an S3 driver is in place  |
| `UPLOAD_DIR`                          | `uploads`                               | Relative to `server/`                                      |
| `MAX_UPLOAD_MB`                       | `5`                                     | Resume size cap                                            |
| `AUTH_RATE_LIMIT` / `AUTH_RATE_WINDOW_MIN` | `20` / `15`                        | Sign-in throttle per IP. Raise locally for automated tests  |
| `EMAIL_ENABLED`                       | `true`                                  | Set `false` to silence notification email entirely          |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | — / `587` / — / —       | Leave `SMTP_HOST` empty in dev to use Ethereal. Required in production |
| `MAIL_FROM`                           | `2addem <no-reply@2addem.local>`        | From address on notification email                          |

The server validates its environment on boot with Zod and refuses to start with a clear message if
anything is missing — no silent misconfiguration.

### `client/.env`

| Variable       | Default | Notes                                                            |
| -------------- | ------- | ---------------------------------------------------------------- |
| `VITE_API_URL` | empty   | Leave empty in dev to use the Vite proxy. Set it to an absolute URL only when pointing at a non-proxied API. |

Secrets are never committed; `.env` is gitignored and `.env.example` files document every key.

---

## Repository layout

```
/server
  /src
    /config       env validation, mongo connection
    /models       User, Company, Job, Application
    /routes       auth, jobs, applications, companies
    /controllers  thin — parse, delegate, respond
    /services     auth, jobs, applications, tokens, storage
    /validators   Zod schemas, one per resource
    /middleware   auth/roles, validation, uploads, error handler
    /utils        ApiError, asyncHandler, response envelopes, slugs, logger
  /uploads        resumes in dev (gitignored)
/client
  /src
    /api          axios instance, interceptors, endpoint map
    /components   ui primitives, layout, route guards
    /features     job cards and filters
    /pages        one file per route
    /context      auth store (Zustand)
    /lib          formatting helpers
```

---

## How it works

### Auth

Access tokens live **in memory only** and expire in 15 minutes. The refresh token is an HTTP-only,
same-site cookie scoped to `/api/auth`, so page scripts cannot read it. On load the client makes one
silent refresh call to restore the session. A 401 on any request triggers a single deduplicated
refresh and one retry; if that fails the user is dropped to anonymous.

Signing out increments a `tokenVersion` on the user, which invalidates every refresh token already
issued — not just the cookie in the current browser.

Credential endpoints are rate limited to 20 requests per 15 minutes per IP.

### Roles

| Role        | Can do                                                                             |
| ----------- | ---------------------------------------------------------------------------------- |
| `candidate` | Browse and search jobs, apply with a resume, track and withdraw own applications    |
| `recruiter` | Belongs to a company; full CRUD on that company's jobs, manage its applicants       |
| `admin`     | Everything a recruiter can do, without the company-ownership restriction            |

Every recruiter route enforces **both** the role and company ownership, so one company can never
read or modify another's jobs or applicants. Admin accounts are provisioned directly in the
database — public registration only accepts `candidate` and `recruiter`.

### Applications

`(job, candidate)` carries a unique index, so double applications are rejected at the database
level rather than only in application code. Withdrawn and decided applications are frozen against
further stage changes. Deleting a job that already has applicants closes it instead of destroying
the candidates' records.

### The pipeline

Each job has a kanban board across the six stages. Cards drag between columns with `@dnd-kit`;
the move is applied optimistically and rolled back if the server rejects it. Withdrawn candidates
are not draggable, and every drag is announced in a live region for screen readers — the stage
dropdown inside the applicant panel is the keyboard-and-mobile equivalent of dragging.

Opening a card slides out a panel with the cover note, answers, resume, private team notes,
tags and a 1–5 score.

### Email

Notifications go out on two events: a new application (to both the candidate and the recruiter)
and a stage change (to the candidate). They are fire-and-forget — a mail outage logs an error but
never fails the request that triggered it.

In development with `SMTP_HOST` empty, the app creates an [Ethereal](https://ethereal.email)
test inbox on the first send and logs a preview URL for each message. Nothing reaches a real
address until you configure SMTP.

### Interviews and notifications

Recruiters schedule interviews from the applicant panel; candidates see upcoming ones on their
dashboard with a join link. Every notable event writes both an email and an in-app notification,
surfaced through the bell in the nav (polled once a minute — no websockets for a project this size).

### Moderation

Admins are never created by public registration; the seed script is the only path. The panel can
search users, deactivate and reactivate accounts, and take jobs down. Two guardrails matter:
deactivating a user bumps their `tokenVersion` so existing sessions die immediately rather than
lasting until the access token expires, and admins cannot deactivate themselves or each other.

Taking a job down closes it instead of deleting it, and notifies the recruiter. Deletion is only
allowed when nobody has applied — candidates' records are not the moderator's to destroy.

### The AI job-ad builder is a stub

`server/src/services/ai.service.js` makes **no network call and contains no model logic.** It
assembles a deterministic template from the recruiter's own input so the end-to-end flow can be
built and tested without a provider. The UI labels it "Stub" and shows a disclaimer on every
generated draft. The file documents exactly what to replace to wire up the Anthropic API.

### Loading states

Every async view has a skeleton shaped like the content it stands in for, so the page does not
jump when data arrives. There is no full-page spinner anywhere — the only spinner left is inside a
pending button. A thin progress bar at the top covers what skeletons cannot: mutations, background
refetches, and the gap before a page's own skeleton mounts. It waits ~180ms before appearing, so
fast responses never flash a bar.

Skeleton groups are wrapped in a live region, so assistive tech announces "loading" once instead
of reading out a wall of empty boxes, and the sweep animation is disabled under
`prefers-reduced-motion`.

### Built for the Lebanese market

A few things a job board here has to get right, and which a generic clone gets wrong:

- **Salaries are quoted in "fresh" USD.** Since 2019 the lira is not how pay is advertised, and
  "dollars" is ambiguous without saying whether they are fresh. Listings carry a `freshUsd` flag
  and the board renders `$36,000 – $54,000 fresh`. Recruiters can turn it off if they mean lira or
  local-bank dollars.
- **Remote-for-a-company-abroad is its own filter.** Remote work paid from outside the country is a
  materially different proposition to remote work for a local employer, and it is the filter
  candidates here use most.
- **Freelance is a first-class employment type,** not a flavour of contract.
- **Locations** autocomplete from Lebanon's eight governorates and the cities that actually appear
  in listings (`GET /api/meta/locations`). The field stays free text — plenty of roles sit in a
  village or a specific district.
- **Phone numbers** are on candidate profiles and shown to recruiters, formatted `+961` by default
  but not forced, since diaspora applicants have foreign numbers.

### Arabic and RTL

The app ships bilingual. A switcher in the nav flips between English and العربية; the choice is
kept in `localStorage` and, for signed-in users, saved to `user.locale` so notifications and email
arrive in the same language.

How it is built:

- **A ~150-line i18n module** rather than react-i18next. The needs are lookup, interpolation and
  plurals, and `Intl.PluralRules` already handles the hard part — Arabic has six plural categories
  (`zero`, `one`, `two`, `few`, `many`, `other`) and the dictionaries supply all of them. Roughly
  two kilobytes against forty.
- **Missing Arabic falls back to English**, so an untranslated string degrades to readable text
  rather than a raw key. In development a missing key throws, so gaps surface in tests.
- **Layout is logical, not physical.** Every `pl-*`/`mr-*`/`left-*`/`text-left` was converted to
  `ps-*`/`me-*`/`start-*`/`text-start`, so direction is a single `dir` attribute rather than a
  parallel stylesheet. Icons that mean *back* or *next* flip; icons that mean a thing (download,
  mail, star) do not. The skeleton sweep reverses too.
- **Notifications are stored as a type plus parameters**, not a baked English sentence, so the bell
  renders them in whichever language the reader has chosen.
- **No webfont.** Arabic faces are appended to the same font stack, so the app stays offline-safe.

Every user-facing string goes through `t()` — landing, auth, board, job detail, apply, the
candidate tracker, the recruiter dashboard, jobs list, editor, pipeline, applicant panel, company
pages, talent pool and the admin panel. Dates, salaries, relative times and every enum label are
locale-bound through a `useFormat()` hook.

The one deliberate exception is **server validation messages**, which stay English. They surface
rarely, because the client mirrors each rule and shows its own translated message first; the server
copy is the backstop for anything that slips past.

### File storage

Resumes are written to `server/uploads` by multer with generated filenames — the client-supplied
name is never used as a path. Uploads are restricted to PDF/DOC/DOCX by both extension and MIME
type, and capped by `MAX_UPLOAD_MB`. All of this sits behind `services/storage.service.js`; adding
an S3 driver means implementing one object and changing `STORAGE_DRIVER`.

---

## API

All routes are under `/api`. Success responses are `{ success: true, data, meta? }`; errors are
`{ success: false, error: { message, code?, details? } }`. Stack traces are never sent in production.

### Auth

| Method | Route            | Access | Notes                             |
| ------ | ---------------- | ------ | --------------------------------- |
| POST   | `/auth/register` | public | `role` is `candidate`\|`recruiter`; recruiters must send `companyName` |
| POST   | `/auth/login`    | public |                                   |
| POST   | `/auth/refresh`  | cookie | Returns a fresh access token      |
| POST   | `/auth/logout`   | cookie | Revokes all refresh tokens        |
| GET    | `/auth/me`       | auth   |                                   |
| PATCH  | `/auth/me`       | auth   | Name, avatar, profile fields      |

### Jobs

| Method | Route                | Access    | Notes                                                     |
| ------ | -------------------- | --------- | --------------------------------------------------------- |
| GET    | `/meta/locations`    | public    | Lebanese cities and governorates for autocomplete          |
| GET    | `/jobs`              | public    | `q, location, remote, remoteAbroad, employmentType, skills, salaryMin, company, sort, page, limit` |
| GET    | `/jobs/:slugOrId`    | public    | Drafts return 404; increments the view counter            |
| GET    | `/jobs/mine`         | recruiter | Includes drafts, `status` filter                          |
| POST   | `/jobs`              | recruiter | `status` may be `draft` or `published`                    |
| PATCH  | `/jobs/:id`          | recruiter | Owner only                                                |
| PATCH  | `/jobs/:id/status`   | recruiter | `draft` \| `published` \| `closed`                        |
| DELETE | `/jobs/:id`          | recruiter | Closes instead of deleting when applicants exist          |

### Applications

| Method | Route                        | Access    | Notes                                       |
| ------ | ---------------------------- | --------- | ------------------------------------------- |
| POST   | `/jobs/:id/apply`            | candidate | `multipart/form-data` with `resume`         |
| GET    | `/jobs/:id/applications`     | recruiter | Owner only; powers the pipeline board       |
| GET    | `/applications/mine`         | candidate |                                             |
| PATCH  | `/applications/:id/withdraw` | candidate | Own application only                        |
| GET    | `/applications/:id`          | recruiter | Full detail with notes and their authors    |
| PATCH  | `/applications/:id/stage`    | recruiter | Emails the candidate on a real transition   |
| POST   | `/applications/:id/notes`    | recruiter |                                             |
| PATCH  | `/applications/:id/tags`     | recruiter | Stored lowercase and deduplicated           |
| PATCH  | `/applications/:id/score`    | recruiter | `0`–`5`, or `null` to clear                 |

### Companies

| Method | Route                   | Access    | Notes                                        |
| ------ | ----------------------- | --------- | -------------------------------------------- |
| GET    | `/companies/:slug`      | public    | Career page + open roles                     |
| GET    | `/companies/mine`       | recruiter |                                              |
| GET    | `/companies/mine/stats` | recruiter | Dashboard counters, stage split, busiest jobs |
| POST   | `/companies`            | recruiter | For accounts without one                     |
| PATCH  | `/companies/mine`       | recruiter |                                              |

### Interviews, notifications and talent pool

| Method | Route                             | Access    | Notes                                  |
| ------ | --------------------------------- | --------- | -------------------------------------- |
| POST   | `/applications/:id/interviews`    | recruiter | Rejects times in the past              |
| GET    | `/applications/:id/interviews`    | recruiter |                                        |
| GET    | `/interviews/mine`                | candidate | `upcoming=true` for the dashboard      |
| PATCH  | `/interviews/:id`                 | recruiter | Cancelling notifies the candidate      |
| DELETE | `/interviews/:id`                 | recruiter |                                        |
| GET    | `/notifications`                  | auth      | Returns items plus an unread count     |
| PATCH  | `/notifications/:id/read`         | auth      | Own notifications only                 |
| PATCH  | `/notifications/read-all`         | auth      |                                        |
| GET    | `/talent-pool`                    | recruiter | Search by name, headline, note or tag  |
| GET    | `/talent-pool/ids`                | recruiter | Drives the "already saved" state       |
| POST   | `/talent-pool`                    | recruiter | Unique per (company, candidate)        |
| PATCH  | `/talent-pool/:id`                | recruiter |                                        |
| DELETE | `/talent-pool/:id`                | recruiter |                                        |
| POST   | `/jobs/ai-draft`                  | recruiter | **Stub** — template only, no model     |

### Admin

| Method | Route                     | Access | Notes                                          |
| ------ | ------------------------- | ------ | ---------------------------------------------- |
| GET    | `/admin/overview`         | admin  | Platform-wide counters                         |
| GET    | `/admin/users`            | admin  | Search by name/email, filter by role and status |
| PATCH  | `/admin/users/:id/active` | admin  | Deactivating also revokes live sessions        |
| GET    | `/admin/jobs`             | admin  |                                                |
| PATCH  | `/admin/jobs/:id/takedown`| admin  | Closes the job and notifies its author         |
| DELETE | `/admin/jobs/:id`         | admin  | Refused when the job has applicants            |
| GET    | `/admin/companies`        | admin  |                                                |

---

## Trying it out

There is no seed script yet (it is a Phase 3 task), so the fastest path is:

Fastest path — run `npm run seed:fresh`, then sign in as `recruiter1@2addem.dev` and open
**Jobs → Pipeline** on *Senior Frontend Engineer*. Drag a card between stages, open one for notes,
tags, score and interview scheduling. **Talent** shows the saved candidates.

Then sign in as `candidate1@2addem.dev` to see the same pipeline from the other side: application
stages, an upcoming interview with a join link, and the notification bell.

Finally `admin@2addem.dev` for the moderation panel.

To walk through it from scratch instead:

1. Register as an employer at `/register?role=recruiter` — a company is created for you.
2. Fill in **Company** so your career page is not empty, then create a job and **Publish job**.
3. Sign out, register as a candidate, open the job from the board and apply with any PDF.
4. Sign back in as the recruiter to work the pipeline.
5. Watch the server log for Ethereal preview links — one per notification email.

Sign-in and sign-up are rate limited, so many rapid account switches will start returning
"Too many attempts" until the 15-minute window rolls over.

---

## Roadmap

- [x] **Phase 1** — auth and roles, job CRUD, public board with search, apply flow with resume
      upload, candidate application tracking, recruiter applicant list and stage changes
- [x] **Phase 2** — drag-and-drop kanban pipeline, notes/tags/scores in the UI, recruiter and
      candidate dashboards, editable company profile, email notifications
- [x] **Phase 3** — interview scheduling, in-app notifications, admin moderation, talent pool,
      AI job-ad stub, seed script and a responsive pass

- [x] **Market localization** — Lebanese location autocomplete, fresh-USD salaries, a
      remote-for-abroad filter, freelance as an employment type, and phone numbers on profiles
- [x] **Arabic + RTL** — i18n layer with Arabic plurals, a language switcher, logical-property
      layout, direction-aware icons, localised dates/salaries/enums, notifications rendered from
      stored parameters, and every page translated.

Explicitly out of scope: multiposting to external job boards, payments, and real AI generation.
