# rokdajob — System Architecture

> **rokdajob** — Local workforce marketplace + contractor CRM for India.
> Tagline: **"Kaam bhi. Log bhi. Ek jagah."**

## 1. Repository layout

The repo is a **npm-workspaces monorepo** built around the three folders you created,
plus one shared source-only package so types/validation are never duplicated.

```
rokda/
├─ package.json            # workspace root, orchestration scripts
├─ shared/                 # @rokdajob/shared  (types + zod schemas + constants + enums)
├─ backend/                # @rokdajob/backend (Node + Express + TS + Mongoose)   :5000
├─ frontend/               # @rokdajob/frontend (Next.js App Router)               :3000
├─ adminpanel/             # @rokdajob/adminpanel (Next.js App Router)             :3001
└─ docs/                   # this documentation
```

**Why a shared package:** the API contract (job statuses, application stages, skill
slugs, DTO shapes, zod request schemas) is used by all three apps. Duplicating it in
three places is the single most likely source of drift in a product like this.
`shared` compiles to `shared/dist` (CJS + `.d.ts`); backend imports the build,
Next apps transpile it via `transpilePackages`.

## 2. Runtime topology

```
 ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
 │  frontend    │        │  adminpanel  │        │ (future)     │
 │  Next.js     │        │  Next.js     │        │ mobile app   │
 │  :3000       │        │  :3001       │        │              │
 └──────┬───────┘        └──────┬───────┘        └──────┬───────┘
        │  HTTPS / JSON         │                       │
        └───────────────┬───────┴───────────────────────┘
                        ▼
              ┌──────────────────────┐
              │  backend  Express    │  :5000  /api/v1
              │  Controller          │
              │    → Service         │  business rules live here
              │      → Repository    │  the only layer that talks to Mongoose
              │        → Model       │
              └──────────┬───────────┘
                         ▼
            ┌────────────────────────┐      ┌─────────────┐
            │  MongoDB (2dsphere)    │      │ Cloudinary  │
            └────────────────────────┘      └─────────────┘
```

There is **no Next.js API route** doing business logic. Next is a rendering +
BFF-free client; every write goes to Express. This keeps one authorization surface.

## 3. Backend layering rules

| Layer | Responsibility | May import |
|---|---|---|
| `routes` | URL → middleware chain → controller | controller, middleware, validation |
| `controller` | HTTP in / HTTP out. No business rules. | service, dto |
| `service` | Business rules, transactions, cross-entity orchestration | repository, other services, events |
| `repository` | Mongoose queries, projections, indexes, aggregation | model |
| `model` | Schema, indexes, hooks | — |

A controller must never `import Model`. A repository must never read `req`.

Module folder shape (`backend/src/modules/<domain>/`):

```
job.model.ts  job.repository.ts  job.service.ts  job.controller.ts  job.routes.ts  job.validation.ts
```

## 4. Cross-cutting decisions (the ones the brief left open)

| # | Decision | Choice | Rationale |
|---|---|---|---|
| D1 | Identity | **Email + username + password**, or Google OAuth. One scheme for every role; phone is optional profile data, not a login method | One login path is far less code and less to get wrong than two; Google removes the password for the desktop half of the market |
| D2 | Role at signup | Registration asks employee (`WORKER`) or contractor (`EMPLOYER`). Workers are usable at once; contractors are created `PENDING` and an admin approves them | The side that posts jobs and contacts workers is the side worth reviewing |
| D3 | Token strategy | Short-lived **access JWT (15m) in memory/header** + **refresh JWT (30d) in httpOnly cookie**, rotated on use with a server-side `RefreshToken` allowlist | Allows real logout + theft detection; cookie survives low-end browsers |
| D4 | Google OAuth | Authorization-code flow driven directly with `fetch`, no passport. `state` is an HMAC-signed payload echoed in an httpOnly cookie | Two endpoints and no session store; a stolen callback URL alone is not enough to sign in |
| D5 | Geo model | Every locatable doc stores `location.geo: { type:'Point', coordinates:[lng,lat] }` with a **2dsphere** index; hierarchy stored as denormalised slugs (`stateSlug`,`citySlug`,`localitySlug`,`pincode`) | `$geoNear` for radius, plain equality index for SEO pages |
| D6 | Distance calculation | Always MongoDB `$geoNear` in an aggregation pipeline; never JS haversine over a result set | Correct + indexed + returns `distanceMeters` for free |
| D7 | Search | **Structured search first** (skill + location + radius + filters). A thin `parseSearchQuery()` maps `"electrician near andheri"` → structured filters via skill/location dictionaries. No LLM. | Brief §16 |
| D8 | Money | Wages stored as **integer paise-free rupees** (`number`, ₹/day or ₹/hour) plus `salaryType` enum. Never floats-as-currency beyond rupee granularity. | Avoids float drift |
| D9 | File uploads | Multer memory storage → validation (mime sniff + size) → Cloudinary stream upload. No files on disk. | Stateless deploys |
| D10 | Realtime | Messaging written against a `RealtimeGateway` interface with an HTTP-polling implementation today; Socket.IO adapter drops in later without touching services | Brief §20 |
| D11 | Admin auth | Same `User` collection, `role: ADMIN`, but admin routes additionally require `adminLevel` and are mounted under `/api/v1/admin` with a stricter rate limit | One identity system |
| D12 | Notifications | `NotificationService.emit(event)` fan-out with pluggable transports (in-app DB row now; push/SMS/email adapters later) | Brief §19 |
| D13 | Application uniqueness | Compound unique index `{ job, worker }` on `applications` — DB-enforced, not app-enforced | Brief §43 |
| D14 | Vacancy accounting | `job.hiredCount` maintained inside the hire transaction; job auto-flips to `FILLED` when `hiredCount >= workersRequired` | Brief §43 |
| D15 | Soft delete | `deletedAt` on User/Job/Company; all repositories filter it by default | Moderation + audit |
| D16 | API versioning | All routes under `/api/v1` | — |
| D17 | Error contract | Every error response: `{ success:false, error:{ code, message, details? } }` with a machine-readable `code` enum | Clients can branch without string matching |
| D18 | Pagination | Cursor-free `page`/`limit` for CRM tables, `?cursor=` for feeds. Envelope: `{ items, page, limit, total, hasMore }` | Tables need totals; feeds don't |

## 5. Response envelope

```jsonc
// success
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 132, "hasMore": true } }
// failure
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid input", "details": [ ... ] } }
```

## 6. Security posture (implemented in Phase 1 + 4)

helmet · CORS allowlist · rate limits (global, auth, otp, search) · bcrypt(12) ·
JWT RS/HS256 with separate access & refresh secrets · `express-mongo-sanitize` ·
zod validation on every body/query/param · payload size caps · role + ownership
middleware · `select:false` on password & tokens · no stack traces in prod.

## 7. Environments

`.env.example` in each app lists every variable. Nothing is read via bare
`process.env` in application code — everything goes through a zod-validated
`config` module that **fails fast at boot** if a required variable is missing.
