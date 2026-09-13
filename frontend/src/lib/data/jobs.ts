import { LIMITS } from '@rokdajob/shared';
import type { Job, PaginationMeta } from '@rokdajob/shared';
import { ApiClientError, api } from '@/lib/api/client';
import { buildFallback } from '@/lib/data/prerender';

/**
 * Job discovery, served by `GET /jobs`.
 *
 * Filtering, sorting, distance and pagination all happen in MongoDB, so this module only
 * maps the UI's parameter names onto the API's.
 */

export type JobSort = 'recent' | 'nearest' | 'salary_desc' | 'urgent' | 'workers_needed';

export interface JobSearchParams {
  city?: string;
  locality?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  /** Skill slugs. */
  skills?: string[];
  category?: string;
  shift?: string[];
  urgency?: string[];
  perks?: string[];
  minSalary?: number;
  maxExperience?: number;
  q?: string;
  sort?: JobSort;
  page?: number;
  limit?: number;
}

export interface JobSearchResult {
  items: Job[];
  meta: PaginationMeta;
}

const EMPTY_PAGE = (page: number, limit: number): PaginationMeta => ({
  page,
  limit,
  total: 0,
  totalPages: 0,
  hasMore: false,
});

/** `workers_needed` has no server-side equivalent; it falls back to the default order. */
function apiSort(sort?: JobSort): string {
  return sort && sort !== 'workers_needed' ? sort : 'recent';
}

export async function searchJobs(params: JobSearchParams = {}): Promise<JobSearchResult> {
  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(params.limit ?? LIMITS.pageSizeDefault, LIMITS.pageSizeMax);

  const query = {
    page,
    limit,
    radiusKm: params.radiusKm ?? LIMITS.searchRadiusDefaultKm,
    sort: apiSort(params.sort),
    ...(params.city ? { city: params.city } : {}),
    ...(params.locality ? { locality: params.locality } : {}),
    ...(params.pincode ? { pincode: params.pincode } : {}),
    ...(params.lat !== undefined ? { lat: params.lat } : {}),
    ...(params.lng !== undefined ? { lng: params.lng } : {}),
    ...(params.skills?.length ? { skill: params.skills } : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(params.shift?.length ? { shift: params.shift } : {}),
    ...(params.urgency?.length ? { urgency: params.urgency } : {}),
    ...(params.perks?.length ? { perk: params.perks } : {}),
    ...(params.minSalary ? { salaryMin: params.minSalary } : {}),
    ...(params.maxExperience !== undefined ? { maxExperience: params.maxExperience } : {}),
    ...(params.q?.trim() ? { q: params.q.trim() } : {}),
  };

  return buildFallback(
    'job search',
    async () => {
      try {
        const { items, meta } = await api.list<Job>('/jobs', { query, next: { revalidate: 30 } });
        return { items, meta };
      } catch (error) {
        // An unknown city or pincode is a bad URL, not a crash — render the empty state.
        if (error instanceof ApiClientError && (error.status === 400 || error.status === 404)) {
          return { items: [], meta: EMPTY_PAGE(page, limit) };
        }
        throw error;
      }
    },
    { items: [], meta: EMPTY_PAGE(page, limit) },
  );
}

export async function getJob(idOrSlug: string): Promise<Job | null> {
  return buildFallback(
    `job "${idOrSlug}"`,
    async () => {
      try {
        return await api.get<Job>(`/jobs/${encodeURIComponent(idOrSlug)}`, {
          next: { revalidate: 30 },
        });
      } catch (error) {
        if (error instanceof ApiClientError && (error.status === 404 || error.status === 400)) {
          return null;
        }
        throw error;
      }
    },
    null,
  );
}

/** Other open jobs needing the same skills, for the "similar jobs" rail. */
export async function getSimilarJobs(job: Job, take = 4): Promise<Job[]> {
  const slugs = job.skills.map((skill) => skill.slug);

  const { items } = await searchJobs({
    city: job.location.citySlug,
    ...(slugs.length ? { skills: slugs } : { category: job.category.slug }),
    limit: take + 1,
  });

  return items.filter((candidate) => candidate.id !== job.id).slice(0, take);
}

/**
 * Recommendations are not personalised yet — that needs the worker's own skills and
 * radius, which means an authenticated call. Until then this is the newest open work.
 */
export async function getRecommendedJobs(take = 6): Promise<Job[]> {
  const { items } = await searchJobs({ limit: take, sort: 'recent' });
  return items;
}

export async function getNearbyJobs(radiusKm?: number, take = 12): Promise<Job[]> {
  const { items } = await searchJobs({
    ...(radiusKm ? { radiusKm } : {}),
    limit: take,
    sort: 'recent',
  });
  return items;
}

export async function getUrgentJobs(take = 6): Promise<Job[]> {
  const { items } = await searchJobs({ urgency: ['URGENT'], limit: take, sort: 'urgent' });
  return items;
}

/** Saved jobs need the signed-in worker; the endpoint lands with the applications module. */
export async function getSavedJobs(): Promise<Job[]> {
  return [];
}

export async function getJobCountsByCity(): Promise<Record<string, number>> {
  return buildFallback(
    'job counts by city',
    () => api.get<Record<string, number>>('/jobs/counts-by-city', { next: { revalidate: 300 } }),
    {},
  );
}

export async function getJobCountsByCategory(): Promise<Record<string, number>> {
  return buildFallback(
    'job counts by category',
    () =>
      api.get<Record<string, number>>('/jobs/counts-by-category', {
        next: { revalidate: 300 },
      }),
    {},
  );
}

export async function getLatestJobs(take = 6): Promise<Job[]> {
  const { items } = await searchJobs({ limit: take, sort: 'recent' });
  return items;
}

export interface JobFacet {
  city: string;
  category: string;
  count: number;
}

/** City/category pairs with open jobs, for `generateStaticParams` and the sitemap. */
export async function getJobFacets(): Promise<JobFacet[]> {
  try {
    return await api.get<JobFacet[]>('/jobs/facets', { next: { revalidate: 3600 } });
  } catch {
    // A build must not fail because the API is briefly unreachable.
    return [];
  }
}
