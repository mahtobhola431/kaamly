# rokdajob — Development Roadmap

| Phase | Deliverable | Exit criteria |
|---|---|---|
| **1** | Monorepo, shared package, Next x2, Express+TS, Mongo connection, config validation, lint/format, git | `npm run dev` boots all three; `/api/v1/health` reports db connected; both UIs render |
| **2** | Design system: tokens, fonts, shadcn primitives, layout shells, empty/error/skeleton states | Component gallery route renders every primitive in light and dark |
| **3** | Landing page (12 sections), SEO metadata, responsive 320 to 1440 | Lighthouse mobile 90+ on perf/SEO/a11y |
| **4** | Auth end to end: register, login, refresh, logout, OTP, reset, guards, role routing | Full manual flow plus API tests pass |
| **5** | Worker onboarding and profile (skills, location, wage, availability, avatar) | Profile completion percentage accurate; geo saved |
| **6** | Employer onboarding and company profile | Company created, verification pending |
| **7** | Job posting create/edit/status with validation | Job appears in public search |
| **8** | Worker discovery with geoNear search, filters, sorts | Radius search returns real distances |
| **9** | Worker job discovery (recommended, nearby, urgent, saved) | Recommendations use skills intersected with radius |
| **10** | Employer CRM dashboard, jobs table, worker database, activity feed | Stats are real, not mocked |
| **11** | Application pipeline, hire/reject, vacancy math, auto FILLED | Section 43 rules enforced with tests |
| **12** | Messaging (conversations, messages, unread, job context) | Polling works; gateway abstraction in place |
| **13** | Notification service, dropdown, read state | All section 19 events emit |
| **14** | Reviews both directions, duplicate prevention, rating rollups | Unique index proven by test |
| **15** | Admin panel (users, verification, moderation, catalog, analytics) | Verify a worker end to end |
| **16** | Location master data, hierarchy API, pincode resolve, SEO city pages | 15 cities seeded with localities |
| **17** | SEO: sitemap, robots, JSON-LD JobPosting, per-route metadata | Structured data validates |
| **18** | Performance: images, dynamic imports, pagination, caching, index audit | No collection scans in the slow log |
| **19** | Accessibility pass: keyboard, focus, contrast, aria, dialogs, tables | axe clean on key routes |
| **20** | Testing: unit (services), API (supertest + mongodb-memory-server), component, E2E (Playwright) | Section 49 flows green |
| **21** | Deploy: Docker, CI, env docs, seed script, production hardening | Documented runbook |
