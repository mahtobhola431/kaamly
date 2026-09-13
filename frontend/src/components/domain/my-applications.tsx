'use client';

import { useState } from 'react';
import Link from 'next/link';
import { APPLICATION_STAGE_LABEL, formatWage, type Application } from '@rokdajob/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Loader2, MapPin, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { StageBadge } from '@/components/domain/badges';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiClientError } from '@/lib/api/client';
import { demoAgo } from '@/data/time';
import { getMyApplications, withdrawApplication } from '@/lib/data/applications';
import { routes } from '@/lib/routes';

// The worker's own pipeline, read from `/me/applications`.

const CLOSED = ['REJECTED', 'WITHDRAWN'];

function ApplicationRow({
  application,
  onWithdraw,
}: {
  application: Application;
  onWithdraw: (application: Application) => void;
}) {
  const canWithdraw = !CLOSED.includes(application.stage) && application.stage !== 'HIRED';

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
          <Link
            href={
              application.conversationId
                ? routes.w.conversation(application.conversationId)
                : `${routes.job(application.job.slug)}?intent=message`
            }
          >
            <MessageSquare aria-hidden />
            Message employer
          </Link>
        </Button>
        {canWithdraw ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => onWithdraw(application)}
          >
            Withdraw
          </Button>
        ) : null}
      </div>
    </li>
  );
}

function List({
  items,
  empty,
  onWithdraw,
}: {
  items: Application[];
  empty: React.ReactNode;
  onWithdraw: (application: Application) => void;
}) {
  if (items.length === 0) return <>{empty}</>;

  return (
    <ul className="space-y-3">
      {items.map((application) => (
        <ApplicationRow key={application.id} application={application} onWithdraw={onWithdraw} />
      ))}
    </ul>
  );
}

export function MyApplications() {
  const queryClient = useQueryClient();
  const [withdrawing, setWithdrawing] = useState<Application | null>(null);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['my-applications'],
    // One page of 50, split locally by the tabs, so their counts need no extra requests.
    queryFn: () => getMyApplications({ limit: 50 }),
  });

  const withdraw = useMutation({
    mutationFn: (application: Application) => withdrawApplication(application.id),
    onSuccess: async () => {
      setWithdrawing(null);
      toast.success('Application withdrawn');
      await queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiClientError ? error.message : 'Could not withdraw your application.',
      );
    },
  });

  if (isPending) {
    return (
      <div className="mt-5 space-y-3">
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-5">
        <ErrorState
          title="Could not load your applications"
          description="Check your connection and try again."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const applications = data.items;
  const active = applications.filter(
    (application) => !CLOSED.includes(application.stage) && application.stage !== 'HIRED',
  );
  const hired = applications.filter((application) => application.stage === 'HIRED');
  const closed = applications.filter((application) => CLOSED.includes(application.stage));

  return (
    <>
      <Tabs defaultValue="active" className="mt-5">
        <TabsList>
          <TabsTrigger value="active">In progress ({active.length})</TabsTrigger>
          <TabsTrigger value="hired">Hired ({hired.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({closed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="pt-4">
          <List
            items={active}
            onWithdraw={setWithdrawing}
            empty={
              <EmptyState
                icon={FileText}
                title="No applications in progress"
                description="Applying is one tap — your profile is your application, so there is no form to fill in."
                actions={[{ label: 'Find work near you', href: routes.w.jobs, variant: 'action' }]}
              />
            }
          />
        </TabsContent>

        <TabsContent value="hired" className="pt-4">
          <List
            items={hired}
            onWithdraw={setWithdrawing}
            empty={
              <EmptyState
                title="No completed hires yet"
                description="Once an employer hires you, the job appears here and counts towards your work history."
              />
            }
          />
        </TabsContent>

        <TabsContent value="closed" className="pt-4">
          <List
            items={closed}
            onWithdraw={setWithdrawing}
            empty={
              <EmptyState
                title="Nothing closed"
                description="Rejected and withdrawn applications are kept here for your reference."
              />
            }
          />
        </TabsContent>
      </Tabs>

      <Dialog
        open={withdrawing !== null}
        onOpenChange={(open) => !open && setWithdrawing(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw your application?</DialogTitle>
            <DialogDescription>
              The employer will see that you pulled out of “{withdrawing?.job.title}”. You can
              apply again while the job is still open.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setWithdrawing(null)}
              disabled={withdraw.isPending}
            >
              Keep it
            </Button>
            <Button
              variant="destructive"
              disabled={withdraw.isPending}
              onClick={() => withdrawing && withdraw.mutate(withdrawing)}
            >
              {withdraw.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Withdraw
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
