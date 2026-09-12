import type { Metadata } from 'next';
import Link from 'next/link';
import { BellRing, IndianRupee, MapPin, Phone, Star, Wallet } from 'lucide-react';
import { HowItWorks } from '@/components/marketing/how-it-works';
import { Section } from '@/components/marketing/section';
import { CtaBand, FeatureList } from '@/components/marketing/sections';
import { JobList } from '@/components/domain/job-card';
import { Button } from '@/components/ui/button';
import { howItWorksEmployer, howItWorksWorker } from '@/data/insights';
import { getLatestJobs } from '@/lib/data/jobs';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Find work near you',
  description:
    'Create a free profile, see jobs near your area with the daily rate written clearly, and apply in one tap. No resume needed. Your phone number stays private.',
  alternates: { canonical: '/for-workers' },
};

const BENEFITS = [
  {
    title: 'Work close to home',
    body: 'Set how far you are willing to travel. Jobs outside that distance are not shown to you at all.',
    icon: MapPin,
  },
  {
    title: 'The rate is written down',
    body: 'Daily rate, shift timing and how many days the work will last are on every post, before you apply.',
    icon: IndianRupee,
  },
  {
    title: 'Apply in one tap',
    body: 'No resume, no long forms. Your profile is your application, and you can apply from a basic phone.',
    icon: Wallet,
  },
  {
    title: 'Your number stays private',
    body: 'Employers message you inside the app. Your phone number is only revealed after you respond.',
    icon: Phone,
  },
  {
    title: 'Build a rating that travels',
    body: 'Every completed job adds a rating to your profile, so good work makes the next job easier to get.',
    icon: Star,
  },
  {
    title: 'Get told about new work',
    body: 'When a job matching your trade is posted near you, it appears at the top of your home screen.',
    icon: BellRing,
  },
];

export default async function ForWorkersPage() {
  const jobs = await getLatestJobs(3);

  return (
    <>
      <header className="from-action-subtle/60 border-b bg-gradient-to-b to-transparent">
        <div className="container-marketing py-14 md:py-20">
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
            For workers
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
            Kaam dhoondhne ke liye naka par khade rehne ki zaroorat nahin.
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl text-lg">
            Make a profile once. See work near your area with the rate written clearly, and apply
            with one tap.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="action" size="lg">
              <Link href={routes.register('worker')}>Create a free profile</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={routes.jobs}>See jobs first</Link>
            </Button>
          </div>
          <p className="text-muted-foreground mt-4 text-sm">
            Free for workers. Always. rokdajob never charges you to find work.
          </p>
        </div>
      </header>

      <Section
        eyebrow="How it works"
        title="Four steps to your next job"
        description="It takes about five minutes to set up, once."
      >
        <HowItWorks employerSteps={howItWorksEmployer} workerSteps={howItWorksWorker} />
      </Section>

      <Section tone="muted" eyebrow="Why workers use it" title="Built for how you actually work">
        <FeatureList items={BENEFITS} />
      </Section>

      <Section
        eyebrow="Hiring now"
        title="Work posted recently"
        action={{ href: routes.jobs, label: 'See all jobs' }}
      >
        <JobList jobs={jobs} />
      </Section>

      <Section tone="navy" title="Be careful of anyone asking for money" align="center">
        <div className="mx-auto max-w-2xl space-y-3 text-center text-white/80">
          <p>
            rokdajob is free for workers. No employer on this platform is allowed to ask you for a
            deposit, a registration fee, or money for tools before you start.
          </p>
          <p>
            If someone asks you for money, report the job from the job page. We review every report
            and suspend accounts that break this rule.
          </p>
          <Button asChild variant="action" className="mt-2">
            <Link href={routes.trustSafety}>Read the safety guide</Link>
          </Button>
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
