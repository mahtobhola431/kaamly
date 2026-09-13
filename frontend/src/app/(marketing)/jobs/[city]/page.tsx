import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Briefcase } from 'lucide-react';
import { JobList } from '@/components/domain/job-card';
import { Pagination, ResultCount, SortSelect } from '@/components/domain/result-controls';
import { EmptyState } from '@/components/feedback/empty-state';
import { CategoryGrid } from '@/components/marketing/category-grid';
import { Button } from '@/components/ui/button';
import { getCategories, getCity, getCities } from '@/lib/data/catalog';
import { getJobCountsByCategory, searchJobs } from '@/lib/data/jobs';
import { parseJobParams } from '@/lib/data/params';
import { staticParams } from '@/lib/data/prerender';
import { routes } from '@/lib/routes';

/**
 * SEO landing page for a city.
 *
 * Only cities present in the location master render; anything else is a 404 rather than a
 * thin auto-generated page (docs/06-RISKS.md R14).
 */
export async function generateStaticParams() {
  return staticParams('the city list', async () => {
    const cities = await getCities();
    return cities.map((city) => ({ city: city.slug }));
  });
}

export async function generateMetadata(props: PageProps<'/jobs/[city]'>): Promise<Metadata> {
  const { city: citySlug } = await props.params;
  const city = await getCity(citySlug);
  if (!city) return { title: 'City not found' };

  const { meta } = await searchJobs({ city: citySlug, limit: 1 });

  return {
    title: `Jobs in ${city.name} — daily wage and skilled work`,
    description: `${meta.total} jobs hiring in ${city.name}, ${city.state}. Construction, warehouse, electrical, plumbing and facility work with daily rates and shift timings shown upfront.`,
    alternates: { canonical: routes.jobsByCity(citySlug) },
  };
}

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently posted' },
  { value: 'salary_desc', label: 'Highest pay' },
  { value: 'urgent', label: 'Most urgent' },
  { value: 'workers_needed', label: 'Most openings' },
];

export default async function JobsByCityPage(props: PageProps<'/jobs/[city]'>) {
  const { city: citySlug } = await props.params;
  const raw = await props.searchParams;

  const city = await getCity(citySlug);
  if (!city) notFound();

  const params = { ...parseJobParams(raw), city: citySlug };
  const [results, categories, categoryCounts, allCities] = await Promise.all([
    searchJobs(params),
    getCategories(),
    getJobCountsByCategory(),
    getCities(),
  ]);

  const nearby = allCities
    .filter((item) => item.slug !== citySlug && item.stateSlug === city.stateSlug)
    .slice(0, 4);

  return (
    <>
      <nav aria-label="Breadcrumb" className="border-b">
        <ol className="container-marketing text-muted-foreground flex items-center gap-1.5 py-3 text-sm">
          <li>
            <Link href={routes.jobs} className="hover:text-foreground">
              Jobs
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-foreground font-medium">{city.name}</li>
        </ol>
      </nav>

      <header className="bg-muted/40 border-b">
        <div className="container-marketing py-8">
          <h1 className="text-2xl font-bold md:text-3xl">Jobs in {city.name}</h1>
          <p className="text-muted-foreground mt-1.5 max-w-2xl">
            {results.meta.total} open {results.meta.total === 1 ? 'job' : 'jobs'} across{' '}
            {city.localities
              .slice(0, 4)
              .map((locality) => locality.name)
              .join(', ')}{' '}
            and nearby areas in {city.district}, {city.state}.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="action" size="sm">
              <Link href={`${routes.workers}?city=${citySlug}`}>Find workers in {city.name}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`${routes.jobs}?city=${citySlug}`}>Refine with filters</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container-marketing py-8">
        {results.items.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={`No open jobs in ${city.name} right now`}
            description="Work in this city is posted regularly. Try a nearby city, or check the categories below."
            actions={nearby.map((item) => ({
              label: `Jobs in ${item.name}`,
              href: routes.jobsByCity(item.slug),
            }))}
          />
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <ResultCount meta={results.meta} noun={`jobs in ${city.name}`} />
              <SortSelect options={SORT_OPTIONS} defaultValue="recent" />
            </div>
            <JobList jobs={results.items} />
            <Pagination meta={results.meta} className="mt-8" />
          </>
        )}

        <section className="mt-12" aria-labelledby="by-category">
          <h2 id="by-category" className="text-lg font-semibold">
            Browse {city.name} jobs by category
          </h2>
          <div className="mt-4">
            <CategoryGrid
              categories={categories}
              counts={categoryCounts}
              buildHref={(slug) => routes.jobsByCityCategory(citySlug, slug)}
            />
          </div>
        </section>

        {nearby.length > 0 ? (
          <section className="mt-12" aria-labelledby="nearby">
            <h2 id="nearby" className="text-lg font-semibold">
              Nearby cities
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {nearby.map((item) => (
                <Button key={item.slug} asChild variant="outline" size="sm">
                  <Link href={routes.jobsByCity(item.slug)}>{item.name}</Link>
                </Button>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
