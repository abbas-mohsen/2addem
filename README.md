# Hirefold

A two-sided hiring platform in the MERN stack, modelled on join.com. Candidates browse a public
job board and apply with a resume; recruiters publish roles and work applicants through a pipeline.

> Status: **Phase 1 complete** — the app runs end to end. Phase 2 (kanban ATS, dashboards, email)
> and Phase 3 (interviews, admin, seed data) are not built yet. See [Roadmap](#roadmap).

---

## Stack

| Layer    | Choice                                                                    |
| -------- | ------------------------------------------------------------------------- |
| API      | Node + Express 5, ES modules, Mongoose 8, Zod validation, JWT, multer      |
| Client   | React 19 + Vite 7, React Router 7, TanStack Query, Zustand, Tailwind CSS 4 |
| Database | MongoDB                                                                   |

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
npm run dev            # API on :4000 and client on :5173, together
```

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
| GET    | `/jobs`              | public    | `q, location, remote, employmentType, skills, salaryMin, company, sort, page, limit` |
| GET    | `/jobs/:slugOrId`    | public    | Drafts return 404; increments the view counter            |
| GET    | `/jobs/mine`         | recruiter | Includes drafts, `status` filter                          |
| POST   | `/jobs`              | recruiter | `status` may be `draft` or `published`                    |
| PATCH  | `/jobs/:id`          | recruiter | Owner only                                                |
| PATCH  | `/jobs/:id/status`   | recruiter | `draft` \| `published` \| `closed`                        |
| DELETE | `/jobs/:id`          | recruiter | Closes instead of deleting when applicants exist          |

### Applications

| Method | Route                        | Access    | Notes                                    |
| ------ | ---------------------------- | --------- | ---------------------------------------- |
| POST   | `/jobs/:id/apply`            | candidate | `multipart/form-data` with `resume`      |
| GET    | `/jobs/:id/applications`     | recruiter | Owner only                               |
| GET    | `/applications/mine`         | candidate |                                          |
| PATCH  | `/applications/:id/withdraw` | candidate | Own application only                     |
| PATCH  | `/applications/:id/stage`    | recruiter |                                          |
| POST   | `/applications/:id/notes`    | recruiter |                                          |
| PATCH  | `/applications/:id/tags`     | recruiter |                                          |
| PATCH  | `/applications/:id/score`    | recruiter | `0`–`5`, or `null` to clear              |

### Companies

| Method | Route             | Access    | Notes                     |
| ------ | ----------------- | --------- | ------------------------- |
| GET    | `/companies/:slug`| public    | Career page + open roles  |
| GET    | `/companies/mine` | recruiter |                           |
| POST   | `/companies`      | recruiter | For accounts without one  |
| PATCH  | `/companies/mine` | recruiter |                           |

---

## Trying it out

There is no seed script yet (it is a Phase 3 task), so the fastest path is:

1. Register as an employer at `/register?role=recruiter` — a company is created for you.
2. Create a job and hit **Publish job**.
3. Sign out, register as a candidate, open the job from the board and apply with any PDF.
4. Sign back in as the recruiter and open **Applicants** to move the candidate through stages.

Sign-in and sign-up are rate limited, so many rapid account switches will start returning
"Too many attempts" until the 15-minute window rolls over.

---

## Roadmap

- [x] **Phase 1** — auth and roles, job CRUD, public board with search, apply flow with resume
      upload, candidate application tracking, recruiter applicant list and stage changes
- [ ] **Phase 2** — drag-and-drop kanban pipeline, notes/tags/scores in the UI, recruiter and
      candidate dashboards, editable company profile, email notifications
- [ ] **Phase 3** — interview scheduling, in-app notifications, admin moderation, talent pool,
      AI job-ad stub, seed script and a full responsive/polish pass

Explicitly out of scope: multiposting to external job boards, payments, and real AI generation.
