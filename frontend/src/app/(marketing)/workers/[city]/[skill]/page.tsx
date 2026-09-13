import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JobList } from '@/components/domain/job-card';
import { Pagination, ResultCount, SortSelect } from '@/components/domain/result-controls';
import { WorkerGrid } from '@/components/domain/worker-card';
import { Button } from '@/components/ui/button';
import { getCity, resolveSkillSlug } from '@/lib/data/catalog';
import { searchJobs } from '@/lib/data/jobs';
import { parseWorkerParams } from '@/lib/data/params';
import { getWorkerFacets, searchWorkers } from '@/lib/data/workers';
import { routes } from '@/lib/routes';

/**
 * SEO page for a skill in a city, e.g. `/workers/mumbai/electricians`.
 *
 * The URL segment is the plural form people search for; `resolveSkillSlug` maps it back to
 * the canonical skill slug, so both `electricians` and `electrician` resolve.
 */
export async function generateStaticParams() {
  // One aggregation instead of a search per city/skill pair: at 15 cities and 39 skills
  // the probing version made 585 requests and tripped the search rate limit.
  const facets = await getWorkerFacets();
  return facets.map((facet) => ({ city: facet.city, skill: `${facet.skill}s` }));
}

export async function generateMetadata(
  props: PageProps<'/workers/[city]/[skill]'>,
): Promise<Metadata> {
  const { city: citySlug, skill: skillSegment } = await props.params;
  const [city, skill] = await Promise.all([getCity(citySlug), resolveSkillSlug(skillSegment)]);
  if (!city || !skill) return { title: 'Not found' };

  const { meta } = await searchWorkers({ city: citySlug, skills: [skill.slug], limit: 1 });

  return {
    title: `Hire ${skill.name.toLowerCase()}s in ${city.name}`,
    description: `${meta.total} ${skill.name.toLowerCase()}${meta.total === 1 ? '' : 's'} available in ${city.name}, ${city.state}. See experience, expected wage, distance from your site and availability before you contact anyone.`,
    alternates: { canonical: routes.workersByCitySkill(citySlug, skillSegment) },
  };
}

const SORT_OPTIONS = [
  { value: 'nearest', label: 'Nearest first' },
  { value: 'rating', label: 'Best rated' },
  { value: 'experience', label: 'Most experienced' },
  { value: 'wage_asc', label: 'Lowest wage' },
];

export default async function WorkersByCitySkillPage(props: PageProps<'/workers/[city]/[skill]'>) {
  const { city: citySlug, skill: skillSegment } = await props.params;
  const raw = await props.searchParams;

  const [city, skill] = await Promise.all([getCity(citySlug), resolveSkillSlug(skillSegment)]);
  if (!city || !skill) notFound();

  const results = await searchWorkers({
    ...parseWorkerParams(raw),
    city: citySlug,
    skills: [skill.slug],
  });

  if (results.meta.total === 0) notFound();

  const relatedJobs = await searchJobs({ city: citySlug, skills: [skill.slug], limit: 3 });

  return (
    <>
      <nav aria-label="Breadcrumb" className="border-b">
        <ol className="container-marketing text-muted-foreground flex flex-wrap items-center gap-1.5 py-3 text-sm">
          <li>
            <Link href={routes.workers} className="hover:text-foreground">
              Workers
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={`${routes.workers}?city=${citySlug}`} className="hover:text-foreground">
              {city.name}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-foreground font-medium">{skill.name}</li>
        </ol>
      </nav>

      <header className="bg-muted/40 border-b">
        <div className="container-marketing py-8">
          <h1 className="text-2xl font-bold md:text-3xl">
            {skill.name}s in {city.name}
          </h1>
          <p className="text-muted-foreground mt-1.5 max-w-2xl">
            {results.meta.total} {skill.name.toLowerCase()}
            {results.meta.total === 1 ? '' : 's'} across{' '}
            {city.localities
              .slice(0, 3)
              .map((locality) => locality.name)
              .join(', ')}{' '}
            and nearby areas. Distance is measured from {city.name} city centre until you set a
            locality.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="action" size="sm">
              <Link href={routes.e.newJob}>Post a job for {skill.name.toLowerCase()}s</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`${routes.workers}?city=${citySlug}&skill=${skill.slug}`}>
                Refine with filters
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container-marketing py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <ResultCount meta={results.meta} noun={`${skill.name.toLowerCase()}s`} />
          <SortSelect options={SORT_OPTIONS} defaultValue="nearest" />
        </div>

        <WorkerGrid workers={results.items} />
        <Pagination meta={results.meta} className="mt-8" />

        {relatedJobs.items.length > 0 ? (
          <section className="mt-14" aria-labelledby="related-jobs">
            <h2 id="related-jobs" className="text-lg font-semibold">
              {skill.name} jobs in {city.name}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Looking for work rather than hiring? These are open right now.
            </p>
            <JobList jobs={relatedJobs.items} className="mt-5" compact />
          </section>
        ) : null}
      </div>
    </>
  );
}
