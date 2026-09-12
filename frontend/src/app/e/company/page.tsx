import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgeCheck, Building2, MapPin, Pencil } from 'lucide-react';
import { RatingStars } from '@/components/domain/rating-stars';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getCurrentEmployer, getEmployerJobs } from '@/lib/data/employer';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Company profile',
  robots: { index: false, follow: false },
};

export default async function CompanyPage() {
  const [employer, jobs] = await Promise.all([getCurrentEmployer(), getEmployerJobs()]);
  const company = employer.company;
  const liveJobs = jobs.filter((job) => job.status === 'HIRING' || job.status === 'PUBLISHED');

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-xl font-bold sm:text-2xl">Company profile</h1>
        <Button variant="outline" size="sm">
          <Pencil aria-hidden />
          Edit
        </Button>
      </div>

      <section className="bg-card mt-5 rounded-lg border p-5">
        <div className="flex items-start gap-4">
          <span className="bg-primary text-primary-foreground flex size-14 shrink-0 items-center justify-center rounded-md text-lg font-bold">
            {company.name.slice(0, 2).toUpperCase()}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold">{company.name}</h2>
              {company.verification.company ? (
                <Badge variant="success" className="gap-1">
                  <BadgeCheck aria-hidden />
                  Verified
                </Badge>
              ) : (
                <Badge variant="muted">Verification pending</Badge>
              )}
            </div>

            <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 text-sm capitalize">
              <span className="inline-flex items-center gap-1">
                <Building2 className="size-3.5" aria-hidden />
                {company.type.toLowerCase().replace('_', ' ')}
              </span>
              <span className="inline-flex items-center gap-1 normal-case">
                <MapPin className="size-3.5" aria-hidden />
                {company.location.formatted}
              </span>
            </p>

            <div className="mt-2">
              <RatingStars rating={company.ratingAvg} count={company.ratingCount} size="sm" />
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <p className="text-muted-foreground text-sm leading-relaxed">{company.about}</p>

        <Separator className="my-4" />

        <dl className="grid gap-4 sm:grid-cols-3">
          {[
            ['Workforce size', company.size ?? '—'],
            ['Founded', company.foundedYear ? String(company.foundedYear) : '—'],
            ['Live jobs', String(liveJobs.length)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-muted-foreground text-xs">{label}</dt>
              <dd className="mt-0.5 font-medium" data-numeric>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-card mt-4 rounded-lg border p-5">
        <h2 className="font-semibold">Verification</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Verified companies appear with a badge on every job post, and workers apply to them
          noticeably more often.
        </p>

        <ul className="mt-4 space-y-3">
          {[
            {
              label: 'Business details reviewed',
              done: company.verification.company,
              help: 'Our team confirmed the company name, type and location.',
            },
            {
              label: 'GSTIN verified',
              done: company.verification.gstin,
              help: 'Adds a stronger trust signal for larger hires.',
            },
          ].map((item) => (
            <li key={item.label} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-muted-foreground text-xs">{item.help}</p>
              </div>
              <Badge variant={item.done ? 'success' : 'muted'}>
                {item.done ? 'Verified' : 'Not submitted'}
              </Badge>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-card mt-4 rounded-lg border p-5">
        <h2 className="font-semibold">Who posts on behalf of this company</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          {employer.user.name} · {employer.designation}
        </p>
        <Button asChild variant="ghost" size="sm" className="mt-2 px-0">
          <Link href={routes.e.settings}>Manage team access</Link>
        </Button>
      </section>
    </div>
  );
}
