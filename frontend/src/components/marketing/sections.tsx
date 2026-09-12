import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Check, Quote } from 'lucide-react';
import { StatCard } from '@/components/domain/stat-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Small marketing blocks shared by the landing page and the audience pages. */

export function FeatureList({
  items,
  className,
}: {
  items: { title: string; body: string; icon?: LucideIcon }[];
  className?: string;
}) {
  return (
    <ul className={cn('grid gap-5 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {items.map((item) => (
        <li key={item.title} className="bg-card rounded-lg border p-5">
          <span className="bg-success-subtle text-success flex size-9 items-center justify-center rounded-md">
            {item.icon ? (
              <item.icon className="size-4.5" aria-hidden />
            ) : (
              <Check className="size-4.5" aria-hidden />
            )}
          </span>
          <h3 className="mt-3 font-semibold">{item.title}</h3>
          <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{item.body}</p>
        </li>
      ))}
    </ul>
  );
}

export function StatsRow({ stats }: { stats: { label: string; value: number; suffix: string }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          suffix={stat.suffix}
          animate
        />
      ))}
    </div>
  );
}

export function Testimonials({
  items,
}: {
  items: { quote: string; name: string; role: string; location: string }[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <figure key={item.name} className="bg-card flex flex-col rounded-lg border p-6">
          <Quote className="text-action size-5 shrink-0" aria-hidden />
          <blockquote className="mt-3 flex-1 text-base leading-relaxed">
            &ldquo;{item.quote}&rdquo;
          </blockquote>
          <figcaption className="mt-4 border-t pt-4 text-sm">
            <span className="font-semibold">{item.name}</span>
            <span className="text-muted-foreground block">
              {item.role} · {item.location}
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export function AudienceSplit({
  employerHref = '/workers',
  workerHref = '/jobs',
}: {
  employerHref?: string;
  workerHref?: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="bg-primary text-primary-foreground rounded-lg p-8">
        <p className="text-action text-xs font-semibold uppercase tracking-widest">For employers</p>
        <h3 className="mt-2 text-2xl font-bold">Need 10 helpers tomorrow?</h3>
        <p className="mt-2 text-white/70">
          Post the job in two minutes and start seeing applications from workers near your site the
          same day. Manage everything from one dashboard.
        </p>
        <ul className="mt-5 space-y-2 text-sm text-white/80">
          {[
            'Search workers by skill, distance and availability',
            'Track applicants through a hiring pipeline',
            'Keep your regular crew in teams for the next site',
          ].map((line) => (
            <li key={line} className="flex items-start gap-2">
              <Check className="text-action mt-0.5 size-4 shrink-0" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
        <Button asChild variant="action" className="mt-6">
          <Link href={employerHref}>Find workers</Link>
        </Button>
      </div>

      <div className="bg-card rounded-lg border p-8">
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
          For workers
        </p>
        <h3 className="mt-2 text-2xl font-bold">Apply for nearby work.</h3>
        <p className="text-muted-foreground mt-2">
          See jobs sorted by how far they are from your area, with the daily rate written clearly
          before you apply. No resume needed.
        </p>
        <ul className="mt-5 space-y-2 text-sm">
          {[
            'Jobs within the distance you are willing to travel',
            'Rate, shift timing and duration shown upfront',
            'Your phone number stays hidden until you are in touch',
          ].map((line) => (
            <li key={line} className="flex items-start gap-2">
              <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
        <Button asChild variant="outline" className="mt-6">
          <Link href={workerHref}>Find work</Link>
        </Button>
      </div>
    </div>
  );
}

export function CtaBand() {
  return (
    <section className="bg-action text-action-foreground">
      <div className="container-marketing flex flex-col items-center gap-6 py-14 text-center md:py-16">
        <h2 className="max-w-2xl text-balance text-3xl font-bold">
          Post a job in 2 minutes. See workers available now.
        </h2>
        <p className="max-w-xl text-base text-black/70">
          Free to start. No listing fees while we grow with our first employers.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-navy-600"
          >
            <Link href="/e/jobs/new">Post a job</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-black/20 bg-transparent hover:bg-black/5"
          >
            <Link href="/auth/register?role=worker">Create a worker profile</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <dl className="divide-border grid divide-y">
      {items.map((item) => (
        <div key={item.q} className="grid gap-2 py-5 md:grid-cols-[1fr_1.5fr] md:gap-8">
          <dt className="font-semibold">{item.q}</dt>
          <dd className="text-muted-foreground text-sm leading-relaxed">{item.a}</dd>
        </div>
      ))}
    </dl>
  );
}
