import { Suspense } from 'react';
import type { Metadata } from 'next';
import { JobFilters } from '@/components/domain/job-filters';
import { SearchBar } from '@/components/domain/search-bar';
import { CardGridSkeleton } from '@/components/feedback/skeletons';
import { getCategories, getCities } from '@/lib/data/catalog';
import { parseJobParams } from '@/lib/data/params';
import { JobResults } from './results';

export const metadata: Metadata = {
  title: 'Daily wage and skilled jobs near you',
  description:
    'Find construction, warehouse, electrical, plumbing, driving and facility jobs near you. Daily rate, shift timing and number of openings shown on every post.',
  alternates: { canonical: '/jobs' },
};

export default async function JobsPage(props: PageProps<'/jobs'>) {
  const raw = await props.searchParams;
  const params = parseJobParams(raw);

  const [cities, categories] = await Promise.all([getCities(), getCategories()]);
  const cityName = params.city ? cities.find((city) => city.slug === params.city)?.name : undefined;
  const resultsKey = JSON.stringify(params);

  return (
    <>
      <div className="bg-muted/40 border-b">
        <div className="container-marketing py-8">
          <h1 className="text-2xl font-bold md:text-3xl">
            {cityName ? `Jobs in ${cityName}` : 'Find work near you'}
          </h1>
          <p className="text-muted-foreground mt-1.5">
            Every post shows the daily rate, shift timing and how many workers are needed before you
            apply.
          </p>
          <div className="mt-5 max-w-3xl">
            <SearchBar
              cities={cities}
              mode="jobs"
              defaultQuery={params.q ?? ''}
              defaultCity={params.city ?? ''}
            />
          </div>
        </div>
      </div>

      <div className="container-marketing grid gap-6 py-8 lg:grid-cols-[280px_1fr]">
        <JobFilters cities={cities} categories={categories} />

        <div>
          <Suspense key={resultsKey} fallback={<CardGridSkeleton count={6} variant="job" />}>
            <JobResults params={params} cityName={cityName} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
