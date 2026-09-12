# rokdajob — Design System

## Palette (OKLCH tokens, light + dark)

| Token | Role | Light |
|---|---|---|
| `--navy` / `primary` | Trust. Nav, sidebar, headings, primary surfaces | `#0F2547` |
| `--navy-fg` | on navy | `#F8FAFC` |
| `--amber` / `accent` | **Action.** CTAs, active states, job highlights | `#F0850B` |
| `--amber-fg` | on amber | `#1A1205` |
| `--verified` / `success` | Verified · Available · Completed | `#1F9254` |
| `--background` | warm off-white | `#FAF9F7` |
| `--card` | `#FFFFFF` |
| `--muted` | `#F1F0ED` |
| `--foreground` | charcoal | `#14181F` |
| `--muted-foreground` | slate | `#5B6470` |
| `--border` | `#E4E2DD` |
| `--destructive` | errors only | `#C2410C`→`#B42318` |

Rule: **orange is never a background for large areas.** It marks the one primary action
per view. Navy carries structure. Green only ever means verified/available/success.

## Type scale (Inter, `next/font`)
`display 40/44 700` · `h1 32/38 700` · `h2 24/30 650` · `h3 20/26 600` · `body 15/24 400`
· `small 13/20 450` · `label 12/16 600 tracking-wide uppercase` · `mono` for IDs/wages tables.
Numbers use `tabular-nums` in tables and stat cards.

## Spacing / radius / elevation
4px base grid. Container max-widths: `1280px` marketing, `1440px` dashboard.
Radius: `--radius: 10px` (cards/inputs), `6px` (badges/chips), `999px` **only** for avatars & status dots.
Shadows: `sm` = `0 1px 2px rgb(15 37 71 / .06)`, `md` = `0 4px 16px rgb(15 37 71 / .08)`. No neon glows.

## Component inventory (`frontend/src/components`)
- `ui/*` — shadcn primitives: button, input, textarea, select, label, badge, card, avatar,
  dialog, sheet, dropdown-menu, tabs, table, tooltip, popover, command, toast/sonner, alert,
  skeleton, separator, checkbox, radio-group, switch, slider, calendar, form, pagination, progress.
- `domain/` — `WorkerCard, WorkerGrid, WorkerFilters, WorkerProfileHeader, JobCard, JobList,
  JobFilters, JobStatusBadge, ApplicationPipeline, ApplicantCard, EmployerSidebar,
  WorkerBottomNav, LocationSelector, SkillSelector, SalaryInput, AvailabilityToggle,
  RatingStars, VerificationBadge, NotificationDropdown, SearchBar, GlobalCommandMenu,
  DashboardStat, AnalyticsCard, EmptyState, ErrorState, LoadingSkeleton, AnimatedCounter`.

## Motion
Framer Motion only for: page/section entrance (`opacity+8px y`, 180ms, once),
pipeline card drag, sheet/dialog (Radix handles), animated counters. Nothing loops. Nothing bounces.
`prefers-reduced-motion` disables all of it.

## Status colour mapping
`DRAFT` slate · `PUBLISHED`/`HIRING` amber · `IN_PROGRESS` navy · `FILLED`/`COMPLETED` green
· `PAUSED` slate outline · `CANCELLED`/`EXPIRED` muted strike.
Pipeline: Applied slate → Reviewed navy-100 → Shortlisted amber → Contacted violet-ish navy →
Interview navy → Selected green-100 → Hired green → Rejected red outline.
