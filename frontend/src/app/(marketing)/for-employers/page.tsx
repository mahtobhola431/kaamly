import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BarChart3,
  KanbanSquare,
  MapPin,
  MessageSquare,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { HowItWorks } from '@/components/marketing/how-it-works';
import { Section } from '@/components/marketing/section';
import { CtaBand, FaqList, FeatureList, Testimonials } from '@/components/marketing/sections';
import { Button } from '@/components/ui/button';
import { faqs, howItWorksEmployer, howItWorksWorker, testimonials } from '@/data/insights';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Hire workers near your site',
  description:
    'Post a job in two minutes, see workers within your travel radius, move applicants through a hiring pipeline and keep your regular crew in teams.',
  alternates: { canonical: '/for-employers' },
};

const CAPABILITIES = [
  {
    title: 'Distance-based worker search',
    body: 'Search by skill and radius from your site. Every result shows how far the worker actually is, not just which city they are in.',
    icon: MapPin,
  },
  {
    title: 'A real hiring pipeline',
    body: 'Applied, reviewed, shortlisted, contacted, interview, selected, hired. Move people across the board and the vacancy count updates itself.',
    icon: KanbanSquare,
  },
  {
    title: 'Your own worker database',
    body: 'Everyone you have shortlisted or hired stays in your list with their skills, rating, last worked date and availability.',
    icon: UsersRound,
  },
  {
    title: 'Messaging with job context',
    body: 'Every conversation is attached to the job it is about, so you never lose track of who you were discussing what with.',
    icon: MessageSquare,
  },
  {
    title: 'Verification you can rely on',
    body: 'Phone-verified accounts, manually reviewed worker profiles and company verification. We never claim a check we have not done.',
    icon: ShieldCheck,
  },
  {
    title: 'Hiring analytics',
    body: 'Applications per week, funnel conversion, time to hire and which skills are hardest to fill in your area.',
    icon: BarChart3,
  },
];

export default function ForEmployersPage() {
  return (
    <>
      <header className="from-navy-50/60 border-b bg-gradient-to-b to-transparent">
        <div className="container-marketing py-14 md:py-20">
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
            For contractors, factories, warehouses and businesses
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
            Need 10 helpers tomorrow? Post it tonight.
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl text-lg">
            rokdajob is a hiring tool built around how site work actually happens — short notice,
            local labour, and a crew you want to call back next month.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
      
            <Button asChild variant="outline" size="lg">
              <Link href={routes.workers}>Search workers first</Link>
            </Button>
          </div>
        </div>
      </header>

      <Section
        eyebrow="How it works"
        title="From a requirement to a crew on site"
        description="Four steps, and none of them involve a spreadsheet."
      >
        <HowItWorks employerSteps={howItWorksEmployer} workerSteps={howItWorksWorker} />
      </Section>

      <Section
        tone="muted"
        eyebrow="What you get"
        title="A CRM for your workforce, not a job board"
        description="Posting the job is the easy part. Everything after it is where the work is."
      >
        <FeatureList items={CAPABILITIES} />
      </Section>

      <Section eyebrow="From the field" title="What contractors say" align="center">
        <Testimonials items={testimonials.slice(0, 2)} />
      </Section>

      <Section tone="muted" title="Questions employers ask">
        <FaqList items={faqs} />
      </Section>

      <CtaBand />
    </>
  );
}
