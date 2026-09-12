# rokdajob — Screen / Route Inventory

## Public marketing (frontend, SSG/ISR, SEO)
| Route | Purpose |
|---|---|
| `/` | Landing: hero, search, how it works, categories, locations, employers, workers, trust, stats, testimonials, CTA, footer |
| `/workers` | Worker discovery (filters + grid + distance list) |
| `/workers/[city]/[skill]` | SEO: `/workers/mumbai/electricians` |
| `/workers/profile/[id]` | Public worker profile |
| `/jobs` | Job discovery |
| `/jobs/[city]` and `/jobs/[city]/[category]` | SEO: `/jobs/bhiwandi/warehouse-workers` |
| `/jobs/[slug]` | Job detail + apply |
| `/categories` and `/locations` | Taxonomy hubs |
| `/for-employers` `/for-workers` `/pricing` `/trust-safety` `/about` `/contact` | Marketing |
| `/legal/terms` `/legal/privacy` | Legal |

## Auth
`/auth/role` (choose Worker/Employer) - `/auth/login` - `/auth/register`
`/auth/otp` - `/auth/forgot-password` - `/auth/reset-password`

## Worker app (mobile-first, bottom nav)
`/w` home - `/w/jobs` nearby+recommended - `/w/jobs/saved` - `/w/applications`
`/w/messages` - `/w/messages/[id]` - `/w/profile` - `/w/profile/edit`
`/w/profile/skills` - `/w/profile/documents` - `/w/reviews` - `/w/work-history` - `/w/notifications`
`/w/onboarding` (5 steps: basics, skills, location+radius, wage+availability, phone verify)

## Employer CRM (desktop-first, sidebar)
`/e` dashboard - `/e/jobs` - `/e/jobs/new` - `/e/jobs/[id]` - `/e/jobs/[id]/edit`
`/e/jobs/[id]/applicants` - `/e/applicants` (global pipeline board)
`/e/workers` (search + saved worker DB) - `/e/workers/[id]`
`/e/teams` - `/e/teams/[id]` - `/e/contacts` - `/e/messages` - `/e/activity`
`/e/analytics` - `/e/company` - `/e/settings` - `/e/onboarding`

## Admin panel (separate Next app, :3001)
`/login` - `/` dashboard - `/users` - `/workers` - `/workers/[id]` (verification queue)
`/employers` - `/companies` - `/jobs` - `/applications` - `/reports` - `/reviews`
`/catalog/categories` - `/catalog/skills` - `/catalog/locations`
`/analytics` - `/activity` - `/settings`

## Shared states
Every list route implements: loading skeleton, data, empty state with a useful CTA, and an error state with retry.
