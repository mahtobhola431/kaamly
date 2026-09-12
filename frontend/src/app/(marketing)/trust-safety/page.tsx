import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, Flag } from 'lucide-react';
import { Section } from '@/components/marketing/section';
import { FeatureList } from '@/components/marketing/sections';
import { Button } from '@/components/ui/button';
import { trustSignals } from '@/data/insights';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Trust and safety',
  description:
    'What each verification badge on rokdajob actually means, how worker phone numbers are protected, and how to report a job or account.',
  alternates: { canonical: '/trust-safety' },
};

const WORKER_RULES = [
  'Never pay anyone a fee, deposit or commission to get a job. No genuine employer on rokdajob will ask.',
  'Agree the daily rate, working hours and duration before you travel to the site.',
  'Do not hand over your original Aadhaar, PAN or licence to anyone. A photocopy or photo is enough.',
  'If a job asks you to travel to another state, confirm accommodation and the return arrangement in writing first.',
  'Keep the conversation inside rokdajob until you are comfortable. Your number is not shared automatically.',
];

const EMPLOYER_RULES = [
  'Write the rate, shift and duration into the job post. Disputes almost always start with a vague post.',
  'Verify skills with a short trial day rather than paperwork where you can.',
  'Never ask a worker for money, documents you do not need, or their original ID.',
  'Use the in-app messages so both sides have a record of what was agreed.',
  'Rate honestly after the job. The rating system only works if it reflects what happened.',
];

export default function TrustSafetyPage() {
  return (
    <>
      <header className="bg-muted/40 border-b">
        <div className="container-marketing py-12">
          <h1 className="text-3xl font-bold md:text-4xl">Trust and safety</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl text-lg">
            Hiring works when both sides can believe what they are looking at. Here is exactly what
            we check, what we do not, and what to do when something is wrong.
          </p>
        </div>
      </header>

      <Section
        eyebrow="Verification"
        title="What each badge means"
        description="We only display a badge for a check we have actually carried out."
      >
        <FeatureList items={trustSignals} />

        <div className="border-destructive/25 bg-destructive-subtle mt-6 flex gap-3 rounded-lg border p-5">
          <AlertTriangle className="text-destructive mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <h3 className="font-semibold">What we do not claim</h3>
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
              rokdajob does not perform police verification, background checks, or any government
              identity verification, and no badge on this platform should be read as one. A verified
              profile means we confirmed a working phone number and reviewed the profile for
              consistency — nothing more.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="muted" eyebrow="For workers" title="Rules that keep you safe">
        <ol className="grid gap-3 md:grid-cols-2">
          {WORKER_RULES.map((rule, index) => (
            <li key={rule} className="bg-card flex gap-3 rounded-lg border p-4">
              <span className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold">
                {index + 1}
              </span>
              <p className="text-sm leading-relaxed">{rule}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="For employers" title="Hiring responsibly">
        <ol className="grid gap-3 md:grid-cols-2">
          {EMPLOYER_RULES.map((rule, index) => (
            <li key={rule} className="bg-card flex gap-3 rounded-lg border p-4">
              <span className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold">
                {index + 1}
              </span>
              <p className="text-sm leading-relaxed">{rule}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="navy" title="Reporting something" align="center">
        <div className="mx-auto max-w-2xl text-center">
          <Flag className="text-action mx-auto size-8" aria-hidden />
          <p className="mt-4 text-white/80">
            Every job post and every profile has a report option. Reports go to a moderation queue
            reviewed by our team, and accounts that break the rules are suspended. If someone has
            asked you for money, tell us — that is the fastest way to get them removed.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="action">
              <Link href={routes.contact}>Report a problem</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/25 bg-transparent text-white hover:bg-white/10"
            >
              <Link href={routes.privacy}>How we handle your data</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
