import type { Metadata } from 'next';
import Link from 'next/link';
import { formatWage } from '@rokdajob/shared';
import { Briefcase, MoreHorizontal, Plus } from 'lucide-react';
import { JobStatusBadge } from '@/components/domain/badges';
import { EmptyState } from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { demoAgo, demoDay } from '@/data/time';
import { getEmployerApplications, getEmployerJobs } from '@/lib/data/employer';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Jobs',
  robots: { index: false, follow: false },
};

export default async function EmployerJobsPage(props: PageProps<'/e/jobs'>) {
  const raw = await props.searchParams;
  const statusFilter = typeof raw.status === 'string' ? raw.status : undefined;

  const [jobs, applications] = await Promise.all([getEmployerJobs(), getEmployerApplications()]);

  const filtered = statusFilter ? jobs.filter((job) => job.status === statusFilter) : jobs;

  const countsFor = (slug: string) => {
    const forJob = applications.filter((application) => application.job.slug === slug);
    return {
      applications: forJob.length,
      shortlisted: forJob.filter((application) =>
        ['SHORTLISTED', 'CONTACTED', 'INTERVIEW', 'SELECTED'].includes(application.stage),
      ).length,
      hired: forJob.filter((application) => application.stage === 'HIRED').length,
    };
  };

  const statuses = ['HIRING', 'PUBLISHED', 'DRAFT', 'PAUSED', 'FILLED', 'COMPLETED'] as const;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Jobs</h1>
          <p className="text-muted-foreground mt-1 text-sm" data-numeric>
            {jobs.length} total · {jobs.filter((job) => job.status === 'HIRING').length} hiring
          </p>
        </div>
        <Button asChild variant="action" size="sm">
          <Link href={routes.e.newJob}>
            <Plus aria-hidden />
            Post a job
          </Link>
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild variant={statusFilter ? 'outline' : 'default'} size="sm">
          <Link href={routes.e.jobs}>All ({jobs.length})</Link>
        </Button>
        {statuses.map((status) => {
          const count = jobs.filter((job) => job.status === status).length;
          if (count === 0) return null;
          return (
            <Button
              key={status}
              asChild
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
            >
              <Link href={`${routes.e.jobs}?status=${status}`}>
                {status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')} ({count})
              </Link>
            </Button>
          );
        })}
      </div>

      <div className="mt-5">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={statusFilter ? 'No jobs with this status' : 'No jobs posted yet'}
            description="A job post takes about two minutes: title, location, how many workers, the rate and the start date."
            actions={[
              { label: 'Post your first job', href: routes.e.newJob, variant: 'action' },
              ...(statusFilter ? [{ label: 'Show all jobs', href: routes.e.jobs }] : []),
            ]}
          />
        ) : (
          <div className="bg-card overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-64">Job</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Needed</TableHead>
                  <TableHead className="text-right">Applications</TableHead>
                  <TableHead className="text-right">Shortlisted</TableHead>
                  <TableHead className="min-w-32">Hired</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.map((job) => {
                  const counts = countsFor(job.slug);
                  const percent = Math.round((job.hiredCount / job.workersRequired) * 100);

                  return (
                    <TableRow key={job.id}>
                      <TableCell>
                        <Link href={routes.e.job(job.slug)} className="font-medium hover:underline">
                          {job.title}
                        </Link>
                        <p className="text-muted-foreground text-xs" data-numeric>
                          {formatWage(job.salary.amount, job.salary.type)} ·{' '}
                          {job.startDate ? `starts ${demoDay(job.startDate)}` : 'flexible start'}
                        </p>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {job.location.locality ?? job.location.city}
                      </TableCell>
                      <TableCell className="text-right" data-numeric>
                        {job.workersRequired}
                      </TableCell>
                      <TableCell className="text-right" data-numeric>
                        {counts.applications}
                      </TableCell>
                      <TableCell className="text-right" data-numeric>
                        {counts.shortlisted}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={percent} className="h-1.5 w-14" />
                          <span className="text-xs" data-numeric>
                            {job.hiredCount}/{job.workersRequired}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <JobStatusBadge status={job.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {job.publishedAt ? demoAgo(job.publishedAt) : '—'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${job.title}`}
                            >
                              <MoreHorizontal aria-hidden />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={routes.e.jobApplicants(job.slug)}>View applicants</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={routes.e.editJob(job.slug)}>Edit job</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={routes.job(job.slug)}>View public page</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              {job.status === 'PAUSED' ? 'Resume hiring' : 'Pause hiring'}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Close job
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}
