import type { Metadata } from 'next';
import Link from 'next/link';
import { APPLICATION_STAGE_LABEL, formatWage } from '@rokdajob/shared';
import type { Application } from '@rokdajob/shared';
import { FileText, MapPin } from 'lucide-react';
import { StageBadge } from '@/components/domain/badges';
import { EmptyState } from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { demoAgo } from '@/data/time';
import { getMyApplications } from '@/lib/data/worker-area';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'My applications',
  robots: { index: false, follow: false },
};

/** The worker's own view of the pipeline — one row per application, newest first. */
function ApplicationRow({ application }: { application: Application }) {
  const latest = application.stageHistory[application.stageHistory.length - 1];

  return (
    <li className="bg-card rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">
            <Link href={routes.job(application.job.slug)} className="hover:text-primary">
              {application.job.title}
            </Link>
          </h3>
          <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              {application.job.location.locality ?? application.job.location.city}
            </span>
            <span data-numeric>
              {formatWage(application.job.salary.amount, application.job.salary.type)}
            </span>
            <span>Applied {demoAgo(application.createdAt)}</span>
            {application.source === 'INVITED' ? (
              <span className="text-action-hover font-medium">Invited by employer</span>
            ) : null}
          </p>
        </div>
        <StageBadge stage={application.stage} />
      </div>

      {application.rejectionReason ? (
        <p className="text-muted-foreground bg-muted mt-3 rounded-md px-3 py-2 text-sm">
          Employer&apos;s note: {application.rejectionReason}
        </p>
      ) : null}

      <ol className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {application.stageHistory.map((event, index) => (
          <li key={`${event.stage}-${index}`} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden>→</span> : null}
            <span
              className={
                index === application.stageHistory.length - 1 ? 'text-foreground font-medium' : ''
              }
            >
              {APPLICATION_STAGE_LABEL[event.stage]}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={routes.job(application.job.slug)}>View job</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href={routes.w.messages}>Message employer</Link>
        </Button>
        {latest && !['HIRED', 'REJECTED', 'WITHDRAWN'].includes(application.stage) ? (
          <Button variant="ghost" size="sm" className="text-destructive">
            Withdraw
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export default async function ApplicationsPage() {
  const applications = await getMyApplications();

  const active = applications.filter(
    (application) => !['HIRED', 'REJECTED', 'WITHDRAWN'].includes(application.stage),
  );
  const hired = applications.filter((application) => application.stage === 'HIRED');
  const closed = applications.filter((application) =>
    ['REJECTED', 'WITHDRAWN'].includes(application.stage),
  );

  return (
    <>
      <h1 className="text-xl font-bold sm:text-2xl">My applications</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Every job you have applied to, and where it has reached.
      </p>

      <Tabs defaultValue="active" className="mt-5">
        <TabsList>
          <TabsTrigger value="active">In progress ({active.length})</TabsTrigger>
          <TabsTrigger value="hired">Hired ({hired.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({closed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="pt-4">
          {active.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No applications in progress"
              description="Applying is one tap — your profile is your application, so there is no form to fill in."
              actions={[{ label: 'Find work near you', href: routes.w.jobs, variant: 'action' }]}
            />
          ) : (
            <ul className="space-y-3">
              {active.map((application) => (
                <ApplicationRow key={application.id} application={application} />
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="hired" className="pt-4">
          {hired.length === 0 ? (
            <EmptyState
              title="No completed hires yet"
              description="Once an employer hires you, the job appears here and counts towards your work history."
            />
          ) : (
            <ul className="space-y-3">
              {hired.map((application) => (
                <ApplicationRow key={application.id} application={application} />
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="closed" className="pt-4">
          {closed.length === 0 ? (
            <EmptyState
              title="Nothing closed"
              description="Rejected and withdrawn applications are kept here for your reference."
            />
          ) : (
            <ul className="space-y-3">
              {closed.map((application) => (
                <ApplicationRow key={application.id} application={application} />
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
