import { Users } from 'lucide-react';
import { Pagination, ResultCount, SortSelect } from '@/components/domain/result-controls';
import { WorkerGrid } from '@/components/domain/worker-card';
import { EmptyState } from '@/components/feedback/empty-state';
import { searchWorkers, type WorkerSearchParams } from '@/lib/data/workers';
import { routes } from '@/lib/routes';

const SORT_OPTIONS = [
  { value: 'nearest', label: 'Nearest first' },
  { value: 'rating', label: 'Best rated' },
  { value: 'experience', label: 'Most experienced' },
  { value: 'wage_asc', label: 'Lowest wage' },
  { value: 'available', label: 'Available now' },
  { value: 'recent', label: 'Recently active' },
];

/**
 * Suspended results section.
 *
 * Kept separate from the page so the loading boundary sits *below* the page's own
 * existence checks — a `loading.tsx` above them would flush a 200 before `notFound()`
 * could set a 404, turning missing pages into soft 404s.
 */
export async function WorkerResults({
  params,
  cityName,
}: {
  params: WorkerSearchParams;
  cityName?: string;
}) {
  const results = await searchWorkers(params);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <ResultCount meta={results.meta} noun="workers" />
        <SortSelect options={SORT_OPTIONS} defaultValue={params.city ? 'nearest' : 'rating'} />
      </div>

      {results.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            params.city
              ? `No workers found within ${params.radiusKm ?? 15} km of ${cityName}`
              : 'No workers match these filters'
          }
          description="Try widening the search radius, removing a filter, or searching a nearby city."
          actions={[
            { label: 'Clear filters', href: routes.workers, variant: 'action' },
            { label: 'Browse categories', href: routes.categories },
          ]}
        />
      ) : (
        <>
          <WorkerGrid workers={results.items} />
          <Pagination meta={results.meta} className="mt-8" />
        </>
      )}
    </>
  );
}
