# kaamly

**Kaam bhi. Log bhi. Ek jagah.**

A local workforce marketplace and contractor CRM for India. Contractors, construction
companies, warehouses, factories and small businesses find skilled and unskilled workers
near a worksite; workers find nearby work, apply, and manage their applications.

---

## Repository layout

| Folder | Package | Port | What it is |
|---|---|---|---|
| `shared/` | `@rokdajob/shared` | — | Types, enums, constants, zod schemas, HTTP client and design tokens used by all three apps |
| `backend/` | `@rokdajob/backend` | 5000 | Express + TypeScript + Mongoose API |
| `frontend/` | `@rokdajob/frontend` | 3000 | Next.js App Router — marketing site, worker app, employer CRM |
| `adminpanel/` | `@rokdajob/adminpanel` | 3001 | Next.js App Router — internal operations console |
| `docs/` | — | — | Architecture, database, API, design system, roadmap, risks |

The three folders are npm workspaces of the repository root, which is why there is a
`package.json` and a single `package-lock.json` at the top level.

## Requirements

- Node.js 20.9+ (built and verified on 22.15)
- npm 10+
- MongoDB — Atlas, a local `mongod`, or the bundled in-memory server (below)

## First run

```bash
npm install                 # installs every workspace
npm run build:shared        # compiles @rokdajob/shared (backend imports the build)
```

Create the environment files:

```bash
cp backend/.env.example      backend/.env
cp frontend/.env.example     frontend/.env.local
cp adminpanel/.env.example   adminpanel/.env.local
```

Then fill in `backend/.env`. The API validates every variable at boot and refuses to start
with a readable report if something is missing, so you will know immediately.

Generate the two JWT secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### No MongoDB installed?

```bash
npm run dev:db -w @rokdajob/backend
```

That starts a disposable in-memory **replica set** (so transactions behave as they do on
Atlas) and prints a `MONGODB_URI` to paste into `backend/.env`. Data is not persisted.

### Start everything

```bash
npm run dev
```

| URL | What |
|---|---|
| http://localhost:3000 | Web app |
| http://localhost:3001 | Admin panel |
| http://localhost:5000/api/v1/health | API health, including database status |

Individual apps: `npm run dev:backend`, `npm run dev:frontend`, `npm run dev:admin`.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Shared package in watch mode plus all three apps |
| `npm run build` | Production build of all apps (`shared` first) |
| `npm run typecheck` | `tsc --noEmit` across every workspace |
| `npm run lint` | ESLint across every workspace |
| `npm run format` | Prettier write |
| `npm run seed` | Seed categories, skills, locations and demo accounts (Phase 16) |

## Environment variables

Nothing reads `process.env` directly. The backend goes through `backend/src/config/env.ts`
and the web apps through `src/lib/env.ts`, both zod-validated. Every variable is documented
in the `.env.example` files:

- `backend/.env.example` — MongoDB, JWT secrets, CORS, rate limits, Cloudinary, OTP/SMS, SMTP, feature flags
- `frontend/.env.example` and `adminpanel/.env.example` — API URL, site URL, app environment

Real credentials belong only in `.env` / `.env.local`, which are git-ignored.

## Documentation

| Document | Contents |
|---|---|
| [docs/00-ARCHITECTURE.md](docs/00-ARCHITECTURE.md) | Layering rules and the 18 cross-cutting decisions |
| [docs/01-DATABASE.md](docs/01-DATABASE.md) | Every collection, field and index, including the geospatial design |
| [docs/02-API.md](docs/02-API.md) | Full REST surface, status codes, error contract |
| [docs/03-DESIGN-SYSTEM.md](docs/03-DESIGN-SYSTEM.md) | Palette, type scale, spacing, component inventory, motion rules |
| [docs/04-SCREENS.md](docs/04-SCREENS.md) | Every route across the three apps |
| [docs/05-ROADMAP.md](docs/05-ROADMAP.md) | 21 phases with exit criteria |
| [docs/06-RISKS.md](docs/06-RISKS.md) | Technical risks and how each is handled |

## Build status

**Phase 1 (foundation) is complete and verified.** Phases 2 onward are listed in the
roadmap. Anything not yet built is stated as not built — the Phase 1 status pages at
`/` in both web apps show exactly what is wired up.
