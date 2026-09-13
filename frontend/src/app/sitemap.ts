import type { MetadataRoute } from 'next';
import { getCities } from '@/lib/data/catalog';
import { getJobFacets, searchJobs } from '@/lib/data/jobs';
import { getWorkerFacets, searchWorkers } from '@/lib/data/workers';
import { siteUrl } from '@/lib/env';
import { routes } from '@/lib/routes';

/**
 * Sitemap covering the marketing pages, every job and worker profile, and the SEO
 * city/skill and city/category combinations that actually have records — the same
 * thin-page rule the pages themselves enforce (docs/06-RISKS.md R14).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cities, jobs, workers] = await Promise.all([
    getCities(),
    searchJobs({ limit: 50 }),
    searchWorkers({ limit: 50 }),
  ]);

  const now = new Date();

  // `as const` keeps `changeFrequency` as its literal union rather than widening to string.
  const staticPages: MetadataRoute.Sitemap = (
    [
      { url: siteUrl(routes.home), priority: 1, changeFrequency: 'daily' },
      { url: siteUrl(routes.jobs), priority: 0.9, changeFrequency: 'hourly' },
      { url: siteUrl(routes.workers), priority: 0.9, changeFrequency: 'hourly' },
      { url: siteUrl(routes.categories), priority: 0.7, changeFrequency: 'weekly' },
      { url: siteUrl(routes.locations), priority: 0.7, changeFrequency: 'weekly' },
      { url: siteUrl(routes.forEmployers), priority: 0.8, changeFrequency: 'monthly' },
      { url: siteUrl(routes.forWorkers), priority: 0.8, changeFrequency: 'monthly' },
      { url: siteUrl(routes.pricing), priority: 0.6, changeFrequency: 'monthly' },
      { url: siteUrl(routes.trustSafety), priority: 0.6, changeFrequency: 'monthly' },
      { url: siteUrl(routes.about), priority: 0.5, changeFrequency: 'monthly' },
      { url: siteUrl(routes.contact), priority: 0.5, changeFrequency: 'monthly' },
      { url: siteUrl(routes.terms), priority: 0.3, changeFrequency: 'yearly' },
      { url: siteUrl(routes.privacy), priority: 0.3, changeFrequency: 'yearly' },
    ] as const
  ).map((entry) => ({ ...entry, lastModified: now }));

  const cityPages: MetadataRoute.Sitemap = cities.map((city) => ({
    url: siteUrl(routes.jobsByCity(city.slug)),
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const cityCategoryPages: MetadataRoute.Sitemap = [];
  const citySkillPages: MetadataRoute.Sitemap = [];

  // Same for job landing pages: one aggregation rather than a request per pair.
  for (const facet of await getJobFacets()) {
    cityCategoryPages.push({
      url: siteUrl(routes.jobsByCityCategory(facet.city, facet.category)),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    });
  }

  // Worker landing pages come from one aggregation of the pairs that actually have
  // workers, rather than a search request per city/skill combination.
  for (const facet of await getWorkerFacets()) {
    citySkillPages.push({
      url: siteUrl(routes.workersByCitySkill(facet.city, `${facet.skill}s`)),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  const jobPages: MetadataRoute.Sitemap = jobs.items.map((job) => ({
    url: siteUrl(routes.job(job.slug)),
    lastModified: new Date(job.updatedAt),
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  const workerPages: MetadataRoute.Sitemap = workers.items.map((worker) => ({
    url: siteUrl(routes.workerProfile(worker.id)),
    lastModified: new Date(worker.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...cityPages,
    ...cityCategoryPages,
    ...citySkillPages,
    ...jobPages,
    ...workerPages,
  ];
}
