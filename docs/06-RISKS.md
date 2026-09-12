# rokdajob — Technical Risks and Mitigations

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | `$geoNear` must be the first aggregation stage; filters bolted on later as `$match` lose the index | Collection scans as the worker table grows | All geo filters are passed inside `$geoNear.query`. One `geoSearch()` repository helper is the only place that builds the pipeline |
| R2 | India location master data (localities, pincodes) is large and not bundled | Cannot ship full coverage from day one | Phase 1 ships a curated seed of 15 cities with localities and pincodes. The `locations` collection is import shaped, so a full pincode dataset loads later with no code change |
| R3 | Workers use low-end Android phones on slow networks | Product unusable for the primary user | Worker routes are server rendered with minimal JS, no chart libraries on worker screens, AVIF images via next/image, paginated lists, bottom nav instead of a drawer |
| R4 | Transactional email deliverability (verification and password reset) | Signup and recovery blocked | No transport is wired yet — `mail.service.ts` logs every message, which is enough for development, and production boot logs an error rather than failing silently. A provider drops into `deliver()` against the existing `SMTP_*` variables. Credential endpoints are rate limited per IP |
| R5 | Race condition on hiring the last vacancy | Over hiring past `workersRequired` | Hire is an atomic `findOneAndUpdate` guarded by `hiredCount < workersRequired`, inside a transaction where the deployment supports it |
| R6 | Duplicate applications from a double tap | Dirty pipeline | Unique compound index on `{job, worker}`; the E11000 error maps to `409 DUPLICATE_APPLICATION` |
| R7 | No realtime chat initially | Messaging feels dead | Polling with backoff plus a `RealtimeGateway` abstraction, so Socket.IO becomes an adapter swap rather than a rewrite |
| R8 | Type drift across three apps sharing one API | Runtime bugs | `@rokdajob/shared` is the single source of enums, DTOs and zod schemas; CI fails if it does not typecheck |
| R9 | Legal exposure on gender and age filters | Regulatory and reputational | These fields are optional, gated behind a config flag, never defaulted, shown with a compliance note, and excluded from worker-side filters by default |
| R10 | Worker phone numbers are scrapeable PII | Spam and poaching | Phone hidden on public profiles, revealed only after contact is established, rate limited and audit logged |
| R11 | Windows development plus monorepo build ordering | "It does not run on my machine" | Root `predev` and `prebuild` build `shared` first; all scripts use cross platform tooling |
| R12 | Mongo transactions are unavailable on a standalone dev database | Hire flow crashes locally | A `withTransaction()` helper detects replica set support and degrades to a guarded non transactional write in dev |
| R13 | Image and document upload abuse | Storage cost, malware | Memory storage, 5MB cap, mime sniffing, extension allowlist, Cloudinary transformation on upload, no public folder listing |
| R14 | SEO pages could be thin or duplicated at launch | Google ignores city x skill pages | Those pages generate only for combinations with at least one live record; everything else returns 404 rather than rendering empty |
