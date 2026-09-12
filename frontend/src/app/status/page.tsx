import { BRAND } from '@rokdajob/shared';
import { ApiClientError, api } from '@/lib/api/client';
import { clientEnv } from '@/lib/env';

/**
 * Phase 1 status page.
 *
 * This is scaffolding, not the product: it proves the web app, the API and MongoDB are
 * wired together and that the design tokens resolve. Phase 3 replaces it with the real
 * landing page (see docs/05-ROADMAP.md).
 */

export const dynamic = 'force-dynamic';

interface HealthPayload {
  service: string;
  status: string;
  environment: string;
  uptimeSeconds: number;
  database: { connected: boolean; host: string | null; name: string | null; transactions: boolean };
}

async function loadHealth(): Promise<{ health: HealthPayload | null; error: string | null }> {
  try {
    const data = await api.get<HealthPayload>('/health', { cache: 'no-store' });
    return { health: data, error: null };
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : 'Unexpected error while contacting the API';
    return { health: null, error: message };
  }
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-block size-2 rounded-full ${ok ? 'bg-success' : 'bg-destructive'}`}
    />
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="border-border flex items-center justify-between gap-4 border-b py-3 last:border-b-0">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="flex items-center gap-2 text-sm font-medium" data-numeric>
        {ok !== undefined ? <StatusDot ok={ok} /> : null}
        {value}
      </dd>
    </div>
  );
}

const PHASES: { n: number; title: string; done: boolean }[] = [
  { n: 1, title: 'Monorepo, API, database, design tokens', done: true },
  { n: 2, title: 'Design system and UI primitives', done: false },
  { n: 3, title: 'Landing page', done: false },
  { n: 4, title: 'Authentication', done: false },
  { n: 5, title: 'Worker profile and onboarding', done: false },
  { n: 6, title: 'Employer onboarding', done: false },
  { n: 7, title: 'Job posting', done: false },
  { n: 8, title: 'Worker discovery and geo search', done: false },
];

export default async function Home() {
  const { health, error } = await loadHealth();
  const apiUp = health !== null;
  const dbUp = health?.database.connected ?? false;

  return (
    <main id="main" className="container-marketing py-12 md:py-20">
      <header className="max-w-2xl">
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
          Phase 1 · Foundation
        </p>
        <h1 className="text-primary mt-3 text-4xl font-bold md:text-5xl">{BRAND.name}</h1>
        <p className="text-muted-foreground mt-2 text-lg">{BRAND.tagline}</p>
        <p className="text-foreground/80 mt-4 text-base">{BRAND.subline}</p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="system-status"
          className="border-border bg-card shadow-card rounded-lg border p-6"
        >
          <h2 id="system-status" className="text-lg font-semibold">
            System status
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Checked live from this server render.
          </p>

          <dl className="mt-4">
            <Row label="Web app" value="Running" ok />
            <Row label="API" value={apiUp ? 'Reachable' : 'Unreachable'} ok={apiUp} />
            <Row label="MongoDB" value={dbUp ? 'Connected' : 'Not connected'} ok={dbUp} />
            <Row
              label="Transactions"
              value={health?.database.transactions ? 'Supported' : 'Standalone (degraded)'}
              ok={health?.database.transactions ?? false}
            />
            <Row label="Database name" value={health?.database.name ?? '—'} />
            <Row label="API environment" value={health?.environment ?? '—'} />
            <Row label="API endpoint" value={clientEnv.NEXT_PUBLIC_API_URL} />
          </dl>

          {error ? (
            <p className="border-destructive/30 bg-destructive-subtle text-destructive mt-4 rounded-md border px-3 py-2 text-sm">
              {error} — start it with <code className="font-mono text-xs">npm run dev:backend</code>
              .
            </p>
          ) : null}
        </section>

        <section
          aria-labelledby="build-progress"
          className="border-border bg-card shadow-card rounded-lg border p-6"
        >
          <h2 id="build-progress" className="text-lg font-semibold">
            Build progress
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Phases are shipped one at a time and verified before the next starts.
          </p>
          <ol className="mt-4 space-y-2">
            {PHASES.map((phase) => (
              <li key={phase.n} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
                    phase.done
                      ? 'bg-success text-success-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {phase.n}
                </span>
                <span className={phase.done ? 'font-medium' : 'text-muted-foreground'}>
                  {phase.title}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section aria-labelledby="palette" className="mt-6">
        <h2 id="palette" className="text-lg font-semibold">
          Colour system
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Navy carries structure and trust, amber marks the one primary action, green means verified
          or available, red is reserved for destructive states.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { name: 'Primary · Navy', className: 'bg-primary text-primary-foreground' },
            { name: 'Accent · Amber', className: 'bg-accent text-accent-foreground' },
            { name: 'Success · Green', className: 'bg-success text-success-foreground' },
            {
              name: 'Destructive · Red',
              className: 'bg-destructive text-destructive-foreground',
            },
          ].map((swatch) => (
            <div
              key={swatch.name}
              className={`flex h-24 items-end rounded-lg p-3 text-sm font-medium ${swatch.className}`}
            >
              {swatch.name}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
