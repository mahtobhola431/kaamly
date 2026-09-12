import { Briefcase } from 'lucide-react';
import { JobList } from '@/components/domain/job-card';
import { Pagination, ResultCount, SortSelect } from '@/components/domain/result-controls';
import { EmptyState } from '@/components/feedback/empty-state';
import { searchJobs, type JobSearchParams } from '@/lib/data/jobs';
import { routes } from '@/lib/routes';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently posted' },
  { value: 'nearest', label: 'Nearest first' },
  { value: 'salary_desc', label: 'Highest pay' },
  { value: 'urgent', label: 'Most urgent' },
  { value: 'workers_needed', label: 'Most openings' },
];

/** See the note in the workers equivalent: the boundary must sit below existence checks. */
export async function JobResults({
  params,
  cityName,
}: {
  params: JobSearchParams;
  cityName?: string;
}) {
  const results = await searchJobs(params);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <ResultCount meta={results.meta} noun="jobs" />
        <SortSelect options={SORT_OPTIONS} defaultValue={params.city ? 'nearest' : 'recent'} />
      </div>

      {results.items.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={
            cityName ? `No open jobs match this in ${cityName}` : 'No jobs match these filters'
          }
          description="Try a wider radius or fewer filters. New work is posted every day, so it is worth checking back."
          actions={[
            { label: 'Clear filters', href: routes.jobs, variant: 'action' },
            { label: 'Browse all categories', href: routes.categories },
          ]}
        />
      ) : (
        <>
          <JobList jobs={results.items} />
          <Pagination meta={results.meta} className="mt-8" />
        </>
      )}
    </>
  );
}
