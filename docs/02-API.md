# rokdajob — API Architecture

Base: `/api/v1` · JSON only · auth via `Authorization: Bearer <access>` + `rj_rt` httpOnly refresh cookie.

## Conventions
- `200` read/update · `201` create · `204` delete · `400` validation · `401` unauthenticated
  `403` unauthorised · `404` missing · `409` conflict (duplicate apply) · `422` business rule · `429` rate limit
- Every list endpoint accepts `page`, `limit` (max 50), `sort`.
- Error codes: `VALIDATION_ERROR, UNAUTHENTICATED, TOKEN_EXPIRED, FORBIDDEN, NOT_FOUND,
  DUPLICATE_APPLICATION, JOB_NOT_OPEN, VACANCIES_FULL, ALREADY_REVIEWED, RATE_LIMITED, INTERNAL`

## Auth `/auth`
Email/username + password, plus Google OAuth. Access token in the body, refresh token in the
`rj_rt` httpOnly cookie scoped to `/api/v1/auth`.

| Method | Path | Notes |
|---|---|---|
| POST | `/register` | `{role:WORKER\|EMPLOYER, name, username, email, password, phone?, companyName?}` — WORKER ("employee") is usable at once, EMPLOYER ("contractor") lands at `approval.status=PENDING` |
| POST | `/login` | `{identifier, password}` — identifier is the email **or** the username |
| GET  | `/availability?username=&email=` | live signup check |
| GET  | `/google?role=&redirect=` | redirects to Google consent; `role` pre-selects employee/contractor |
| GET  | `/google/callback` | sets the refresh cookie, redirects to the web app with the access token in the URL **fragment** |
| POST | `/complete-registration` | auth — finishes a Google signup that arrived with no role |
| POST | `/refresh` | rotates the refresh family; reuse of a rotated token revokes the family |
| POST | `/logout` · `/logout-all` | revokes this session / every session |
| POST | `/password/forgot` · `/password/reset` · `/password/change` | reset and change both end every session |
| POST | `/email/verify` · `/email/resend` | |
| GET  | `/me` | current user + approval state + completion |

**Blocked-account codes** (403, so the client can branch instead of bouncing to login):
`ACCOUNT_PENDING_APPROVAL`, `ACCOUNT_REJECTED`, `ACCOUNT_SUSPENDED`, `EMAIL_NOT_VERIFIED`.
Bad credentials return 401 `INVALID_CREDENTIALS` with one message for both a wrong password
and a missing account, so the endpoint cannot enumerate registered addresses.

## Admin `/admin`
Admin accounts are seeded, never self-registered (`npm run seed:admin -w @rokdajob/backend`).
Every route requires `role=ADMIN`; deciding requires `adminLevel` MODERATOR or SUPER, while
SUPPORT can read the queue only. Each decision is written to `adminactivities`.

| Method | Path | Notes |
|---|---|---|
| GET | `/contractors?status=PENDING\|APPROVED\|REJECTED&q=&page=&limit=` | approval queue |
| GET | `/contractors/counts` | dashboard badge counts |
| GET | `/contractors/:id` | one contractor |
| PATCH | `/contractors/:id/approve` | `{note?}` — idempotent |
| PATCH | `/contractors/:id/reject` | `{reason}` — required; revokes their sessions |
| PATCH | `/users/:id/suspend` · `/users/:id/reactivate` | `{reason}` on suspend |

## Workers `/workers`
`GET /` search (see below) · `GET /:id` public profile · `GET /me/profile`
`POST /me/profile` create · `PATCH /me/profile` · `PATCH /me/availability`
`POST /me/avatar` (multipart) · `POST /me/documents` · `GET /:id/reviews`
`POST /:id/contact` (creates conversation) · `POST /:id/invite` (`{jobId}` → Application source=INVITED)

**Search query params:** `lat,lng | city | locality | pincode`, `radiusKm`, `skill[]`, `category`,
`minExperience`, `availability`, `maxWage`, `minRating`, `verified`, `language[]`, `gender`,
`sort=nearest|rating|experience|wage_asc|available|recent`, `page`, `limit`.

## Jobs `/jobs`
`GET /` public search (same geo params + `category`, `urgency`, `salaryMin`, `shift`)
`GET /:idOrSlug` · `GET /recommended` (worker: skills ∩ radius) · `GET /nearby` · `GET /urgent`
`POST /` (employer) · `PATCH /:id` · `DELETE /:id` · `PATCH /:id/status`
`POST /:id/save` · `DELETE /:id/save` · `POST /:id/reviews`

**Applying** (built)
| Method | Path | Notes |
|---|---|---|
| POST | `/:id/apply` | worker, approved. Body `{coverNote?, expectedWage?, phone?}` — all optional; the profile is the application. `201` for a new application, `200` when one already existed, so a retried tap is never an error. A withdrawn application is revived. `422 JOB_NOT_OPEN` / `422 VACANCIES_FULL` |
| GET | `/:idOrSlug/my-application` | worker — the caller's own application, or `null`. Drives the apply button's state |
| GET | `/:id/applications` | employer, owner-only. `?stage=&q=&sort=recent\|oldest&page=&limit=` |
| GET | `/:id/applications/counts` | employer, owner-only — per-stage counts for the board |

## Employer CRM `/employer`
`GET /dashboard` (stat block, counted live) · `GET /me`

**Company** (built). The company is created from the name given at registration, so every
field is an edit rather than a first entry. `verification` and `ratingAvg` are absent on
purpose — an admin grants the first, completed work earns the second.

| Method | Path | Notes |
|---|---|---|
| GET | `/company` | the contractor's own record, including `gstin` and `activeJobCount`. Owner-only, which is why `gstin` is safe here and absent from `Job['company']` |
| PATCH | `/company` | `{name?, type?, about?, size?, foundedYear?, gstin?, pincode? \| citySlug? \| location?}`. Renaming re-slugs. A **changed** GSTIN clears `verification.gstin`. An empty string clears a field; omitting it leaves it alone. Allowed before approval — filling the profile in is what the admin reviews |
| POST | `/company/logo` | `multipart/form-data`, field `file`. JPEG/PNG/WebP/AVIF, ≤5MB. Resized and stored on Cloudinary under a per-company id, so a replacement overwrites rather than accumulating orphans |

**Pipeline** (built; every route also needs `requireApproved`)
| Method | Path | Notes |
|---|---|---|
| GET | `/applications` | the board. `?stage=&job=&q=&sort=recent\|oldest&page=&limit=` |
| GET | `/applications/counts` | `{columns, counts}` — so an empty board still renders its stages |
| PATCH | `/applications/:id/stage` | `{stage, note?}`. HIRED and REJECTED are **not** accepted here — each does more than move a card. Moves are checked against `ALLOWED_STAGE_TRANSITIONS`, the same table the board renders its menu from |
| POST | `/applications/:id/hire` | `{note?}` — claims a vacancy with one guarded update; the loser of a race gets `422 VACANCIES_FULL`. The last vacancy sets the job to `FILLED` |
| POST | `/applications/:id/reject` | `{reason}` required. Rejecting someone already hired returns their position and reopens the job |

`GET /workers` (employer worker DB) · `GET /activity`
`GET|POST /teams` · `PATCH /teams/:id` · `POST /teams/:id/members` · `DELETE /teams/:id/members/:memberId`
`GET /analytics?range=30d`

## Worker area `/me`  (role=WORKER)
| Method | Path | Notes |
|---|---|---|
| GET | `/applications` | `?stage=&active=true&page=&limit=` — `active` hides withdrawn and rejected |
| GET | `/applications/counts` | per-stage counts plus `total` |
| DELETE | `/applications/:id` | withdraw. Body `{reason?}`. Keeps the row — the employer should see that someone pulled out, and applying again reuses it |

Planned: `GET /saved-jobs` · `GET /work-history` · `GET /dashboard`

## Messaging `/conversations`  (role=WORKER or EMPLOYER)
A thread is always about a job or an application; there is no way to open one with a stranger.
One thread per pair per job, so "Message employer" twice reopens rather than forks.

| Method | Path | Notes |
|---|---|---|
| GET | `/` | inbox. `?job=&q=&page=&limit=`, newest activity first |
| GET | `/unread-count` | `{total, threads}` for the shell badge |
| POST | `/` | `{text, job? \| application? \| recipient?}` — the counterpart is derived, so a job page needs only the job id |
| GET | `/:id` · `GET /:id/messages?cursor=&limit=` | history pages backwards by cursor; `meta.nextCursor` |
| POST | `/:id/messages` | `{body}` |
| POST | `/:id/read` | clears the caller's unread counter |
| DELETE | `/:id` | hides the thread for the caller only |

## Notifications `/notifications`
`GET /` · `GET /unread-count` · `POST /:id/read` · `POST /read-all`

## Taxonomy `/catalog`
`GET /categories` · `GET /skills?category=` · `GET /locations?type=&parent=&q=` · `GET /locations/resolve?pincode=`

## Admin `/admin` — planned additions  (role=ADMIN)
Contractor approval and account status are built (see **Admin `/admin`** above). The rest of
the admin surface lands with its own phase:
`GET /stats` · `GET /users` · `GET /workers` · `POST /workers/:id/verify`
`GET /employers` · `POST /companies/:id/verify` · `GET /jobs` · `PATCH /jobs/:id/status`
`GET /reports` · `PATCH /reports/:id` · CRUD `/categories` `/skills` `/locations`
`GET /analytics/*` · `GET /activity`

## Middleware chain per protected route
`rateLimit → helmet(global) → authenticate → authorize(roles) → requireApproved → validate(zod) → controller → errorHandler`
