import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JobList } from '@/components/domain/job-card';
import { Pagination, ResultCount, SortSelect } from '@/components/domain/result-controls';
import { WorkerGrid } from '@/components/domain/worker-card';
import { Button } from '@/components/ui/button';
import { getCategory, getCity } from '@/lib/data/catalog';
import { getJobFacets, searchJobs } from '@/lib/data/jobs';
import { parseJobParams } from '@/lib/data/params';
import { searchWorkers } from '@/lib/data/workers';
import { routes } from '@/lib/routes';

/**
 * The narrowest SEO page: one category in one city.
 *
 * Generated only for combinations that actually have open jobs. Any other combination
 * returns 404 instead of an empty page Google would treat as thin (docs/06-RISKS.md R14).
 */
export async function generateStaticParams() {
  // One aggregation of the pairs that actually have open jobs, rather than a search
  // request per city/category combination.
  const facets = await getJobFacets();
  return facets.map((facet) => ({ city: facet.city, category: facet.category }));
}

export async function generateMetadata(
  props: PageProps<'/jobs/[city]/[category]'>,
): Promise<Metadata> {
  const { city: citySlug, category: categorySlug } = await props.params;
  const [city, category] = await Promise.all([getCity(citySlug), getCategory(categorySlug)]);
  if (!city || !category) return { title: 'Not found' };

  const { meta } = await searchJobs({ city: citySlug, category: categorySlug, limit: 1 });

  return {
    title: `${category.name} jobs in ${city.name}`,
    description: `${meta.total} ${category.name.toLowerCase()} ${meta.total === 1 ? 'job' : 'jobs'} hiring in ${city.name}, ${city.state}. Daily rate, shift timing and number of openings shown on every post.`,
    alternates: { canonical: routes.jobsByCityCategory(citySlug, categorySlug) },
  };
}

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently posted' },
  { value: 'salary_desc', label: 'Highest pay' },
  { value: 'urgent', label: 'Most urgent' },
];

export default async function JobsByCityCategoryPage(props: PageProps<'/jobs/[city]/[category]'>) {
  const { city: citySlug, category: categorySlug } = await props.params;
  const raw = await props.searchParams;

  const [city, category] = await Promise.all([getCity(citySlug), getCategory(categorySlug)]);
  if (!city || !category) notFound();

  const results = await searchJobs({
    ...parseJobParams(raw),
    city: citySlug,
    category: categorySlug,
  });

  // Thin-page guard: this URL only exists while the combination has live work.
  if (results.meta.total === 0) notFound();

  const relatedWorkers = await searchWorkers({
    city: citySlug,
    category: categorySlug,
    limit: 3,
    sort: 'rating',
  });

  return (
    <>
      <nav aria-label="Breadcrumb" className="border-b">
        <ol className="container-marketing text-muted-foreground flex flex-wrap items-center gap-1.5 py-3 text-sm">
          <li>
            <Link href={routes.jobs} className="hover:text-foreground">
              Jobs
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={routes.jobsByCity(citySlug)} className="hover:text-foreground">
              {city.name}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-foreground font-medium">{category.name}</li>
        </ol>
      </nav>

      <header className="bg-muted/40 border-b">
        <div className="container-marketing py-8">
          <h1 className="text-2xl font-bold md:text-3xl">
            {category.name} jobs in {city.name}
          </h1>
          <p className="text-muted-foreground mt-1.5 max-w-2xl">
            {category.description} {results.meta.total} open{' '}
            {results.meta.total === 1 ? 'position' : 'positions'} in {city.district}, {city.state}.
          </p>
        </div>
      </header>

      <div className="container-marketing py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <ResultCount meta={results.meta} noun="jobs" />
          <SortSelect options={SORT_OPTIONS} defaultValue="recent" />
        </div>

        <JobList jobs={results.items} />
        <Pagination meta={results.meta} className="mt-8" />

        {relatedWorkers.items.length > 0 ? (
          <section className="mt-14" aria-labelledby="hire-instead">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="hire-instead" className="text-lg font-semibold">
                  Hiring for {category.name.toLowerCase()} work in {city.name}?
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  These workers are available in this area right now.
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`${routes.workers}?city=${citySlug}&category=${categorySlug}`}>
                  See all workers
                </Link>
              </Button>
            </div>
            <WorkerGrid workers={relatedWorkers.items} className="mt-5" />
          </section>
        ) : null}
      </div>
    </>
  );
}
