import { LIMITS } from '@rokdajob/shared';
import type { Availability, PaginationMeta, Review, WorkerProfile } from '@rokdajob/shared';
import { cityBySlug, distanceKm } from '@/data/geo';
import { reviewsForWorker } from '@/data/reviews';
import { workers } from '@/data/workers';

/**
 * Worker discovery.
 *
 * Filtering, sorting and pagination are implemented for real against the static dataset,
 * so every UI state — including "no results" — is genuinely reachable. When the API is
 * live this becomes `api.list<WorkerProfile>('/workers', { query: params })`.
 */

export type WorkerSort = 'nearest' | 'rating' | 'experience' | 'wage_asc' | 'available' | 'recent';

export interface WorkerSearchParams {
  /** City slug; also used as the distance origin when no coordinates are given. */
  city?: string;
  locality?: string;
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
  /** Free-text query matched against name, headline, skills and aliases. */
  q?: string;
  sort?: WorkerSort;
  page?: number;
  limit?: number;
}

export interface WorkerSearchResult {
  items: WorkerProfile[];
  meta: PaginationMeta;
}

/** Normalises a per-month wage to a comparable daily figure (26 working days). */
function dailyWage(worker: WorkerProfile): number {
  const { amount, type } = worker.expectedWage;
  if (type === 'PER_MONTH') return Math.round(amount / 26);
  if (type === 'PER_HOUR') return amount * 8;
  return amount;
}

function matchesQuery(worker: WorkerProfile, q: string): boolean {
  const haystack = [
    worker.user.name,
    worker.headline ?? '',
    worker.location.formatted,
    ...worker.skills.flatMap((entry) => [entry.skill.name, ...entry.skill.aliases]),
  ]
    .join(' ')
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

/** Attaches `distanceKm` the way `$geoNear` does, relative to the search origin. */
function withDistance(list: WorkerProfile[], citySlug?: string): WorkerProfile[] {
  const origin = citySlug ? cityBySlug[citySlug]?.coordinates : undefined;
  if (!origin) return list;
  return list.map((worker) => ({
    ...worker,
    distanceKm: distanceKm(origin, worker.location.geo.coordinates),
  }));
}

const SORTERS: Record<WorkerSort, (a: WorkerProfile, b: WorkerProfile) => number> = {
  nearest: (a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999),
  rating: (a, b) => b.ratingAvg - a.ratingAvg,
  experience: (a, b) => b.experienceYears - a.experienceYears,
  wage_asc: (a, b) => dailyWage(a) - dailyWage(b),
  available: (a, b) =>
    Number(b.availability === 'AVAILABLE_NOW') - Number(a.availability === 'AVAILABLE_NOW'),
  recent: (a, b) => (b.user.lastActiveAt ?? '').localeCompare(a.user.lastActiveAt ?? ''),
};

export async function searchWorkers(params: WorkerSearchParams = {}): Promise<WorkerSearchResult> {
  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(params.limit ?? LIMITS.pageSizeDefault, LIMITS.pageSizeMax);
  const radius = params.radiusKm ?? LIMITS.searchRadiusDefaultKm;

  let list = withDistance([...workers], params.city);

  if (params.city) {
    // Within the radius, or in the same city when we have no origin for the locality.
    list = list.filter(
      (worker) =>
        worker.location.citySlug === params.city ||
        (worker.distanceKm !== undefined && worker.distanceKm <= radius),
    );
  }
  if (params.locality) {
    list = list.filter((worker) => worker.location.localitySlug === params.locality);
  }
  if (params.skills?.length) {
    list = list.filter((worker) =>
      worker.skills.some((entry) => params.skills?.includes(entry.skill.slug)),
    );
  }
  if (params.category) {
    list = list.filter(
      (worker) =>
        worker.primaryCategory?.slug === params.category ||
        worker.skills.some((entry) => entry.skill.category.slug === params.category),
    );
  }
  if (params.minExperience) {
    list = list.filter((worker) => worker.experienceYears >= (params.minExperience ?? 0));
  }
  if (params.availability?.length) {
    list = list.filter((worker) => params.availability?.includes(worker.availability));
  }
  if (params.maxWage) {
    list = list.filter((worker) => dailyWage(worker) <= (params.maxWage ?? Infinity));
  }
  if (params.minRating) {
    list = list.filter((worker) => worker.ratingAvg >= (params.minRating ?? 0));
  }
  if (params.verifiedOnly) {
    list = list.filter((worker) => worker.verification.profile);
  }
  if (params.languages?.length) {
    list = list.filter((worker) =>
      worker.languages.some((language) => params.languages?.includes(language)),
    );
  }
  if (params.q?.trim()) {
    list = list.filter((worker) => matchesQuery(worker, params.q as string));
  }

  list.sort(SORTERS[params.sort ?? (params.city ? 'nearest' : 'rating')]);

  const total = list.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const items = list.slice((page - 1) * limit, page * limit);

  return {
    items,
    meta: { page, limit, total, totalPages, hasMore: page < totalPages },
  };
}

export async function getWorker(id: string): Promise<WorkerProfile | null> {
  return workers.find((worker) => worker.id === id || worker.user.id === id) ?? null;
}

export async function getWorkerReviews(workerUserId: string): Promise<Review[]> {
  return reviewsForWorker(workerUserId);
}

/** Workers who share a skill with the given one, for the "similar workers" rail. */
export async function getSimilarWorkers(worker: WorkerProfile, take = 4): Promise<WorkerProfile[]> {
  const slugs = new Set(worker.skills.map((entry) => entry.skill.slug));
  return workers
    .filter(
      (candidate) =>
        candidate.id !== worker.id && candidate.skills.some((entry) => slugs.has(entry.skill.slug)),
    )
    .slice(0, take);
}

/** Counts per city, used by the SEO landing pages and the locations hub. */
export async function getWorkerCountsByCity(): Promise<Record<string, number>> {
  return workers.reduce<Record<string, number>>((counts, worker) => {
    counts[worker.location.citySlug] = (counts[worker.location.citySlug] ?? 0) + 1;
    return counts;
  }, {});
}
