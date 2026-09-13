import { LIMITS } from '@rokdajob/shared';
import type { Availability, PaginationMeta, Review, WorkerProfile } from '@rokdajob/shared';
import { ApiClientError, api } from '@/lib/api/client';

/**
 * Worker discovery, served by `GET /workers`.
 *
 * Filtering, sorting, distance and pagination all happen in MongoDB via `$geoNear`, so
 * this module only maps the UI's parameter names onto the API's and passes them through.
 */

export type WorkerSort = 'nearest' | 'rating' | 'experience' | 'wage_asc' | 'available' | 'recent';

export interface WorkerSearchParams {
  /** City slug; also the distance origin when no coordinates are given. */
  city?: string;
  locality?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  /** Skill slugs. */
  skills?: string[];
  category?: string;
  minExperience?: number;
  availability?: Availability[];
  maxWage?: number;
  minRating?: number;
  verifiedOnly?: boolean;
  languages?: string[];
  q?: string;
  sort?: WorkerSort;
  page?: number;
  limit?: number;
}

export interface WorkerSearchResult {
  items: WorkerProfile[];
  meta: PaginationMeta;
}

const EMPTY_PAGE = (page: number, limit: number): PaginationMeta => ({
  page,
  limit,
  total: 0,
  totalPages: 0,
  hasMore: false,
});

/**
 * The search needs somewhere to search from. Without coordinates, a pincode or a city the
 * API returns 400, so the default city keeps a bare `/workers` page rendering.
 */
const DEFAULT_CITY = 'mumbai';

export async function searchWorkers(params: WorkerSearchParams = {}): Promise<WorkerSearchResult> {
  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(params.limit ?? LIMITS.pageSizeDefault, LIMITS.pageSizeMax);

  const hasOrigin = Boolean(
    params.city ?? params.pincode ?? (params.lat !== undefined && params.lng !== undefined),
  );

  const query: Record<string, string | number | boolean | string[] | undefined> = {
    page,
    limit,
    radiusKm: params.radiusKm ?? LIMITS.searchRadiusDefaultKm,
    sort: params.sort ?? 'nearest',
    ...(hasOrigin ? {} : { city: DEFAULT_CITY }),
    ...(params.city ? { city: params.city } : {}),
    ...(params.locality ? { locality: params.locality } : {}),
    ...(params.pincode ? { pincode: params.pincode } : {}),
    ...(params.lat !== undefined ? { lat: params.lat } : {}),
    ...(params.lng !== undefined ? { lng: params.lng } : {}),
    ...(params.skills?.length ? { skill: params.skills } : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(params.minExperience ? { minExperience: params.minExperience } : {}),
    ...(params.maxWage ? { maxWage: params.maxWage } : {}),
    ...(params.minRating ? { minRating: params.minRating } : {}),
    ...(params.verifiedOnly ? { verified: 'true' } : {}),
    ...(params.languages?.length ? { language: params.languages } : {}),
    ...(params.q?.trim() ? { q: params.q.trim() } : {}),
    // The API takes one availability value; the UI offers a set.
    ...(params.availability?.length === 1 ? { availability: params.availability[0] } : {}),
  };

  try {
    const { items, meta } = await api.list<WorkerProfile>('/workers', {
      query,
      next: { revalidate: 30 },
    });
    return { items, meta };
  } catch (error) {
    // An unknown city or pincode is a bad URL, not a crash — render the empty state.
    if (error instanceof ApiClientError && (error.status === 400 || error.status === 404)) {
      return { items: [], meta: EMPTY_PAGE(page, limit) };
    }
    throw error;
  }
}

export async function getWorker(id: string): Promise<WorkerProfile | null> {
  // Anything that is not a Mongo id cannot identify a worker, so treat it as a miss
  // rather than sending a request the API will reject.
  if (!/^[0-9a-fA-F]{24}$/.test(id)) return null;

  try {
    return await api.get<WorkerProfile>(`/workers/${id}`, { next: { revalidate: 30 } });
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 404 || error.status === 400)) {
      return null;
    }
    throw error;
  }
}

/**
 * Reviews are not built yet — there is no `/workers/:id/reviews` endpoint.
 * Returning nothing keeps the profile page rendering its empty state honestly.
 */
export async function getWorkerReviews(workerUserId: string): Promise<Review[]> {
  void workerUserId;
  return [];
}

/** Workers who share a skill, for the "similar workers" rail on a profile. */
export async function getSimilarWorkers(worker: WorkerProfile, take = 4): Promise<WorkerProfile[]> {
  const slugs = worker.skills.map((entry) => entry.skill.slug);
  if (slugs.length === 0) return [];

  const { items } = await searchWorkers({
    city: worker.location.citySlug,
    skills: slugs,
    radiusKm: LIMITS.searchRadiusMaxKm,
    limit: take + 1,
  });

  return items.filter((candidate) => candidate.id !== worker.id).slice(0, take);
}

/** Counts per city, used by the SEO landing pages and the locations hub. */
export async function getWorkerCountsByCity(): Promise<Record<string, number>> {
  return api.get<Record<string, number>>('/workers/counts-by-city', {
    next: { revalidate: 300 },
  });
}

export interface WorkerFacet {
  city: string;
  skill: string;
  count: number;
}

/**
 * City/skill pairs that actually have workers, for `generateStaticParams`.
 *
 * One request rather than one per combination — the probing version made 585 calls and
 * tripped the search rate limit during a build.
 */
export async function getWorkerFacets(): Promise<WorkerFacet[]> {
  try {
    return await api.get<WorkerFacet[]>('/workers/facets', { next: { revalidate: 3600 } });
  } catch {
    // A build must not fail because the API is briefly unreachable; these pages then
    // render on demand instead of being prerendered.
    return [];
  }
}
