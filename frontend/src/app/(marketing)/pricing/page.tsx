import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Minus } from 'lucide-react';
import { Section } from '@/components/marketing/section';
import { CtaBand, FaqList } from '@/components/marketing/sections';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Free for workers, always. Employers start free and pay only when they need larger searches, bulk invites and CRM seats for their team.',
  alternates: { canonical: '/pricing' },
};

interface Plan {
  name: string;
  price: string;
  cadence?: string;
  audience: string;
  description: string;
  cta: { label: string; href: string };
  featured?: boolean;
  includes: string[];
  excludes?: string[];
}

const PLANS: Plan[] = [
  {
    name: 'Worker',
    price: 'Free',
    audience: 'For workers',
    description: 'Everything a worker needs to find and manage work. No paid tier exists.',
    cta: { label: 'Create a profile', href: routes.register('worker') },
    includes: [
      'Unlimited job applications',
      'Nearby and recommended jobs',
      'Messaging with employers',
      'Ratings and work history',
      'Phone and profile verification',
    ],
  },
  {
    name: 'Starter',
    price: '₹0',
    cadence: 'to begin',
    audience: 'For small contractors',
    description: 'Enough to hire your first crews without paying anything.',
    cta: { label: 'Post a job', href: routes.e.newJob },
    includes: [
      '3 active job posts',
      'Worker search within 25 km',
      'Applicant pipeline',
      '1 CRM user',
      'In-app messaging',
    ],
    excludes: ['Bulk invites', 'Teams', 'Analytics'],
  },
  {
    name: 'Growth',
    price: '₹2,499',
    cadence: 'per month',
    audience: 'For active contractors and factories',
    description: 'For employers hiring across multiple sites every month.',
    cta: { label: 'Start with Growth', href: routes.contact },
    featured: true,
    includes: [
      'Unlimited job posts',
      'Worker search up to 100 km',
      'Bulk invites and shortlists',
      'Teams and worker database',
      '5 CRM users',
      'Hiring analytics',
      'Priority placement in worker feeds',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    audience: 'For large workforces',
    description: 'Multi-city hiring, dedicated support and integration with your systems.',
    cta: { label: 'Talk to us', href: routes.contact },
    includes: [
      'Everything in Growth',
      'Unlimited CRM users',
      'Multi-city dashboards',
      'API access and exports',
      'Dedicated account manager',
      'Custom verification workflows',
    ],
  },
];

const PRICING_FAQS = [
  {
    q: 'Do workers ever pay?',
    a: 'No. Creating a profile, searching, applying and messaging are free for workers and will stay that way. If anyone asks a worker for money, report it.',
  },
  {
    q: 'What happens when my free job posts run out?',
    a: 'Existing posts keep running. You can close or complete a post to free up a slot, or move to Growth for unlimited posts.',
  },
  {
    q: 'Is there a contract?',
    a: 'Growth is billed monthly and can be cancelled any time. Enterprise agreements are annual.',
  },
  {
    q: 'Do you take a cut of wages?',
    a: 'No. Wages are settled directly between the employer and the worker. rokdajob never handles payments.',
  },
];

export default function PricingPage() {
  return (
    <>
      <header className="bg-muted/40 border-b">
        <div className="container-marketing py-12 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">Simple pricing</h1>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-lg">
            Free for workers, always. Employers start free and upgrade when hiring becomes a regular
            part of the week.
          </p>
        </div>
      </header>

      <div className="container-marketing py-12">
        <div className="grid gap-5 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.featured
                  ? 'border-action bg-card relative rounded-lg border-2 p-6 shadow-[var(--shadow-raised)]'
                  : 'bg-card rounded-lg border p-6'
              }
            >
              {plan.featured ? (
                <Badge variant="action" className="absolute -top-3 left-6">
                  Most popular
                </Badge>
              ) : null}

              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                {plan.audience}
              </p>
              <h2 className="mt-2 text-lg font-bold">{plan.name}</h2>
              <p className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold" data-numeric>
                  {plan.price}
                </span>
                {plan.cadence ? (
                  <span className="text-muted-foreground text-sm">{plan.cadence}</span>
                ) : null}
              </p>
              <p className="text-muted-foreground mt-2 text-sm">{plan.description}</p>

              <Button
                asChild
                variant={plan.featured ? 'action' : 'outline'}
                className="mt-5 w-full"
              >
                <Link href={plan.cta.href}>{plan.cta.label}</Link>
              </Button>

              <ul className="mt-5 space-y-2 text-sm">
                {plan.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
                    {item}
                  </li>
                ))}
                {plan.excludes?.map((item) => (
                  <li key={item} className="text-muted-foreground flex items-start gap-2">
                    <Minus className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-muted-foreground mt-6 text-center text-sm">
          Prices exclude GST. Billing is not implemented yet — plans shown here describe the
          intended commercial model.
        </p>
      </div>

      <Section tone="muted" title="Pricing questions">
        <FaqList items={PRICING_FAQS} />
      </Section>

      <CtaBand />
    </>
  );
}
