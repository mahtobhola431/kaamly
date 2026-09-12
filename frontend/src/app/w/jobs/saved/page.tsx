import type { Metadata } from 'next';
import { Bookmark } from 'lucide-react';
import { JobList } from '@/components/domain/job-card';
import { EmptyState } from '@/components/feedback/empty-state';
import { getSavedJobs } from '@/lib/data/jobs';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Saved jobs',
  robots: { index: false, follow: false },
};

export default async function SavedJobsPage() {
  const jobs = await getSavedJobs();

  return (
    <>
      <h1 className="text-xl font-bold sm:text-2xl">Saved jobs</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Jobs you bookmarked to apply to later. Saved jobs disappear once the employer closes them.
      </p>

      <div className="mt-5">
        {jobs.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="Nothing saved yet"
            description="Tap the bookmark icon on any job to keep it here."
            actions={[{ label: 'Find work near you', href: routes.w.jobs, variant: 'action' }]}
          />
        ) : (
          <JobList jobs={jobs} className="sm:grid-cols-2 xl:grid-cols-3" />
        )}
      </div>
    </>
  );
}
