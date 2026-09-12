import type { Metadata } from 'next';
import Link from 'next/link';
import { Bookmark, MapPin, Sparkles, Zap } from 'lucide-react';
import { JobCard } from '@/components/domain/job-card';
import { EmptyState } from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getNearbyJobs, getRecommendedJobs, getSavedJobs, getUrgentJobs } from '@/lib/data/jobs';
import { getCurrentWorker } from '@/lib/data/worker-area';
import { routes } from '@/lib/routes';
import type { Job } from '@rokdajob/shared';

export const metadata: Metadata = {
  title: 'Jobs near you',
  robots: { index: false, follow: false },
};

function JobColumn({
  jobs,
  emptyTitle,
  emptyBody,
}: {
  jobs: Job[];
  emptyTitle: string;
  emptyBody: string;
}) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyBody}
        actions={[
          { label: 'Increase travel distance', href: routes.w.editProfile, variant: 'action' },
          { label: 'Browse all jobs', href: routes.jobs },
        ]}
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}

export default async function WorkerJobsPage() {
  const [worker, nearby, recommended, urgent, saved] = await Promise.all([
    getCurrentWorker(),
    getNearbyJobs(undefined, 20),
    getRecommendedJobs(20),
    getUrgentJobs(20),
    getSavedJobs(),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Jobs near you</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Within {worker.workRadiusKm} km of {worker.location.locality ?? worker.location.city}.
            Change your travel distance any time.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={routes.w.editProfile}>Change area</Link>
        </Button>
      </div>

      <Tabs defaultValue="nearby" className="mt-5">
        <TabsList>
          <TabsTrigger value="nearby">
            <MapPin aria-hidden />
            Nearby ({nearby.length})
          </TabsTrigger>
          <TabsTrigger value="recommended">
            <Sparkles aria-hidden />
            For you ({recommended.length})
          </TabsTrigger>
          <TabsTrigger value="urgent">
            <Zap aria-hidden />
            Urgent ({urgent.length})
          </TabsTrigger>
          <TabsTrigger value="saved">
            <Bookmark aria-hidden />
            Saved ({saved.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nearby" className="pt-4">
          <JobColumn
            jobs={nearby}
            emptyTitle="No jobs within your travel distance"
            emptyBody={`Nothing open within ${worker.workRadiusKm} km right now. Widening your radius usually helps.`}
          />
        </TabsContent>

        <TabsContent value="recommended" className="pt-4">
          <JobColumn
            jobs={recommended}
            emptyTitle="No matches for your skills yet"
            emptyBody="Add more skills to your profile so employers hiring for related trades can find you."
          />
        </TabsContent>

        <TabsContent value="urgent" className="pt-4">
          <JobColumn
            jobs={urgent}
            emptyTitle="No urgent work right now"
            emptyBody="Urgent jobs appear here when employers need workers to start immediately."
          />
        </TabsContent>

        <TabsContent value="saved" className="pt-4">
          <JobColumn
            jobs={saved}
            emptyTitle="You have not saved any jobs"
            emptyBody="Tap the bookmark on a job to keep it here and apply later."
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
