import type { Metadata } from 'next';
import Link from 'next/link';
import { Section } from '@/components/marketing/section';
import { CtaBand } from '@/components/marketing/sections';
import { StatCard } from '@/components/domain/stat-card';
import { Button } from '@/components/ui/button';
import { platformStats } from '@/data/insights';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'About rokdajob',
  description:
    'rokdajob is a local workforce marketplace and contractor CRM for India — connecting contractors, factories and warehouses with the skilled and unskilled workers near their sites.',
  alternates: { canonical: '/about' },
};

const PRINCIPLES = [
  {
    title: 'The worker is a user, not inventory',
    body: 'Workers get a real product: their own profile, their own applications, their own messages, and control over who sees their phone number. Not a row in someone else’s database.',
  },
  {
    title: 'Distance is the unit that matters',
    body: 'A mason 4 km away and a mason 40 km away are not the same result. Everything on this platform is ranked by real distance from the worksite, not by which city name matches.',
  },
  {
    title: 'Say only what is true',
    body: 'A verification badge means a specific check we performed. We do not imply government verification, and we do not inflate ratings or counts.',
  },
  {
    title: 'Works on a cheap phone',
    body: 'The worker side is built to load fast on an entry-level Android on a weak connection, because that is what most of our users actually hold.',
  },
];

export default function AboutPage() {
  return (
    <>
      <header className="from-navy-50/60 border-b bg-gradient-to-b to-transparent">
        <div className="container-marketing py-14">
          <h1 className="max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
            Hiring for site work in India runs on phone calls and luck. It should not.
          </h1>
          <p className="text-muted-foreground mt-5 max-w-2xl text-lg">
            A contractor needing 15 helpers by Monday rings four people who ring four more. A mason
            looking for work stands at the naka hoping a tempo stops. Both sides are solving the
            same problem, badly, in parallel. rokdajob puts them on one map.
          </p>
        </div>
      </header>

      <Section eyebrow="What we are building" title="A marketplace and a CRM, together">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Most job platforms stop at the introduction. That is the easy half. The hard half is
              what a contractor does with 27 applications for a 15-person crew starting tomorrow,
              and what happens to the six good workers they could not take this time.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              So rokdajob is two things at once. For workers it is a clean, fast way to find work
              nearby and manage applications. For employers it is a workforce CRM — a pipeline, a
              worker database, teams, messaging and analytics — built on top of the same data.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We are starting with 15 cities across India&apos;s industrial belts, mapped down to
              locality and pincode so that distance search is genuinely accurate.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {platformStats.map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                suffix={stat.suffix}
                animate
              />
            ))}
          </div>
        </div>
      </Section>

      <Section tone="muted" eyebrow="How we build" title="Four things we will not compromise on">
        <div className="grid gap-4 md:grid-cols-2">
          {PRINCIPLES.map((principle) => (
            <div key={principle.title} className="bg-card rounded-lg border p-6">
              <h3 className="font-semibold">{principle.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{principle.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Talk to us" align="center">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-muted-foreground">
            We are early, and the fastest way to shape this product is to tell us what your hiring
            week actually looks like.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="action">
              <Link href={routes.contact}>Get in touch</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={routes.forEmployers}>See how hiring works</Link>
            </Button>
          </div>
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
