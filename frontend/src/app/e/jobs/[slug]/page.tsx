import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SHIFT_LABEL, formatWage, pluralize } from '@rokdajob/shared';
import { ArrowLeft, ExternalLink, Eye, Pencil, UsersRound } from 'lucide-react';
import { JobStatusBadge, StageBadge, UrgencyBadge } from '@/components/domain/badges';
import { StatCard } from '@/components/domain/stat-card';
import { UserAvatar } from '@/components/domain/user-avatar';
import { EmptyState } from '@/components/feedback/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { demoAgo, demoDay } from '@/data/time';
import { getEmployerApplications, getEmployerJob, getEmployerJobs } from '@/lib/data/employer';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Job details',
  robots: { index: false, follow: false },
};

export async function generateStaticParams() {
  const jobs = await getEmployerJobs();
  return jobs.map((job) => ({ slug: job.slug }));
}

export default async function EmployerJobPage(props: PageProps<'/e/jobs/[slug]'>) {
  const { slug } = await props.params;
  const job = await getEmployerJob(slug);
  if (!job) notFound();

  const applications = await getEmployerApplications({ jobSlug: slug });
  const shortlisted = applications.filter((application) =>
    ['SHORTLISTED', 'CONTACTED', 'INTERVIEW', 'SELECTED'].includes(application.stage),
  ).length;
  const percent = Math.round((job.hiredCount / job.workersRequired) * 100);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={routes.e.jobs}>
          <ArrowLeft aria-hidden />
          Back to jobs
        </Link>
      </Button>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <JobStatusBadge status={job.status} />
            <UrgencyBadge urgency={job.urgency} />
            <Badge variant="secondary">{job.category.name}</Badge>
          </div>
          <h1 className="mt-2 text-xl font-bold sm:text-2xl">{job.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {job.location.formatted} ·{' '}
            {job.publishedAt ? `posted ${demoAgo(job.publishedAt)}` : 'not published'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={routes.job(job.slug)}>
              <ExternalLink aria-hidden />
              Public page
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={routes.e.editJob(job.slug)}>
              <Pencil aria-hidden />
              Edit
            </Link>
          </Button>
          <Button asChild variant="action" size="sm">
            <Link href={routes.e.jobApplicants(job.slug)}>
              <UsersRound aria-hidden />
              Applicants ({applications.length})
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Applications" value={applications.length} />
        <StatCard label="Shortlisted" value={shortlisted} />
        <StatCard label="Hired" value={job.hiredCount} hint={`of ${job.workersRequired} needed`} />
        <StatCard label="Views" value={job.viewCount} icon={Eye} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="bg-card rounded-lg border p-5">
            <h2 className="font-semibold">Filling progress</h2>
            <div className="mt-3">
              <div className="text-muted-foreground mb-1.5 flex items-center justify-between text-sm">
                <span>
                  <span className="text-foreground font-medium" data-numeric>
                    {job.hiredCount}
                  </span>{' '}
                  of {job.workersRequired} hired
                </span>
                <span data-numeric>{pluralize(job.vacanciesLeft, 'position')} left</span>
              </div>
              <Progress value={percent} />
            </div>
            {job.vacanciesLeft === 0 ? (
              <p className="text-success mt-3 text-sm">
                All positions filled — this job moved to Filled automatically. Reopen it if you need
                more workers.
              </p>
            ) : null}
          </section>

          <section className="bg-card rounded-lg border p-5">
            <h2 className="font-semibold">Job details</h2>
            <dl className="mt-3 grid gap-4 sm:grid-cols-2">
              {[
                ['Rate', formatWage(job.salary.amount, job.salary.type)],
                ['Workers required', String(job.workersRequired)],
                ['Starts', job.startDate ? demoDay(job.startDate) : 'Flexible'],
                ['Duration', job.durationDays ? `${job.durationDays} days` : 'Not set'],
                [
                  'Shift',
                  job.workingHours
                    ? `${job.workingHours.from}–${job.workingHours.to} · ${SHIFT_LABEL[job.shift]}`
                    : SHIFT_LABEL[job.shift],
                ],
                [
                  'Experience',
                  job.experienceRequiredYears === 0
                    ? 'None required'
                    : `${job.experienceRequiredYears}+ years`,
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted-foreground text-xs">{label}</dt>
                  <dd className="mt-0.5 font-medium" data-numeric>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <Separator className="my-4" />

            <p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
              {job.description}
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {job.skills.map((skill) => (
                <Badge key={skill.id} variant="secondary">
                  {skill.name}
                </Badge>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="bg-card rounded-lg border">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="font-semibold">Latest applicants</h2>
              <Link
                href={routes.e.jobApplicants(job.slug)}
                className="text-primary text-sm font-semibold"
              >
                All
              </Link>
            </div>

            {applications.length === 0 ? (
              <EmptyState
                bordered={false}
                title="No applicants yet"
                description="Invite workers directly to get the first applications faster."
                actions={[{ label: 'Search workers', href: routes.e.workers, variant: 'action' }]}
              />
            ) : (
              <ul className="divide-y">
                {applications.slice(0, 6).map((application) => (
                  <li key={application.id} className="flex items-center gap-3 px-4 py-3">
                    <UserAvatar user={application.worker} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{application.worker.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {demoAgo(application.createdAt)}
                      </p>
                    </div>
                    <StageBadge stage={application.stage} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-card rounded-lg border p-4">
            <h2 className="font-semibold">Actions</h2>
            <div className="mt-3 grid gap-2">
              <Button variant="outline" size="sm">
                {job.status === 'PAUSED' ? 'Resume hiring' : 'Pause hiring'}
              </Button>
              <Button variant="outline" size="sm">
                Duplicate job
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive justify-start">
                Close this job
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
