import { Suspense } from 'react';
import type { Metadata } from 'next';
import { WorkerFilters } from '@/components/domain/worker-filters';
import { SearchBar } from '@/components/domain/search-bar';
import { CardGridSkeleton } from '@/components/feedback/skeletons';
import { getCategories, getCities, getSkills } from '@/lib/data/catalog';
import { parseWorkerParams } from '@/lib/data/params';
import { WorkerResults } from './results';

export const metadata: Metadata = {
  title: 'Find workers near your worksite',
  description:
    'Search masons, electricians, plumbers, helpers, warehouse staff and more by location, distance, skill, availability and expected wage.',
  alternates: { canonical: '/workers' },
};

export default async function WorkersPage(props: PageProps<'/workers'>) {
  const raw = await props.searchParams;
  const params = parseWorkerParams(raw);

  const [cities, categories, skills] = await Promise.all([
    getCities(),
    getCategories(),
    getSkills(),
  ]);

  const cityName = params.city ? cities.find((city) => city.slug === params.city)?.name : undefined;

  // Results are keyed by the query so the skeleton reappears when filters change.
  const resultsKey = JSON.stringify(params);

  return (
    <>
      <div className="bg-muted/40 border-b">
        <div className="container-marketing py-8">
          <h1 className="text-2xl font-bold md:text-3xl">
            {cityName ? `Workers in ${cityName}` : 'Find workers near your worksite'}
          </h1>
          <p className="text-muted-foreground mt-1.5">
            Filter by skill, distance, availability and expected wage. Distance is measured from the
            city or locality you choose.
          </p>
          <div className="mt-5 max-w-3xl">
            <SearchBar
              cities={cities}
              mode="workers"
              defaultQuery={params.q ?? ''}
              defaultCity={params.city ?? ''}
            />
          </div>
        </div>
      </div>

      <div className="container-marketing grid gap-6 py-8 lg:grid-cols-[280px_1fr]">
        <WorkerFilters cities={cities} categories={categories} skills={skills} />

        <div>
          <Suspense key={resultsKey} fallback={<CardGridSkeleton count={6} variant="worker" />}>
            <WorkerResults params={params} cityName={cityName} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
