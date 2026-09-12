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
`POST /:id/apply` (worker) · `POST /:id/save` · `DELETE /:id/save`
`GET /:id/applications` (employer, owner-only) · `POST /:id/reviews`

## Employer CRM `/employer`
`GET /dashboard` (stat block) · `GET /jobs` · `GET /applications` (pipeline board)
`PATCH /applications/:id/stage` · `POST /applications/:id/hire` · `POST /applications/:id/reject`
`GET /workers` (employer worker DB) · `GET /activity`
`GET|POST /teams` · `PATCH /teams/:id` · `POST /teams/:id/members` · `DELETE /teams/:id/members/:memberId`
`GET /analytics?range=30d`

## Worker area `/me`
`GET /applications` · `DELETE /applications/:id` (withdraw) · `GET /saved-jobs`
`GET /work-history` · `GET /dashboard`

## Messaging `/conversations`
`GET /` · `POST /` · `GET /:id` · `GET /:id/messages?cursor=` · `POST /:id/messages` · `POST /:id/read`

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
