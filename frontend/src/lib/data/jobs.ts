import { LIMITS } from '@rokdajob/shared';
import type { Job, JobStatus, PaginationMeta, Shift, Urgency } from '@rokdajob/shared';
import { cityBySlug, distanceKm } from '@/data/geo';
import { jobs, openJobs, savedJobSlugs } from '@/data/jobs';
import { currentWorker } from '@/data/workers';

/**
 * Job discovery for the public site and the worker app.
 * Becomes `api.list<Job>('/jobs', { query: params })` once the API is live.
 */

export type JobSort = 'recent' | 'nearest' | 'salary_desc' | 'urgent' | 'workers_needed';

export interface JobSearchParams {
  city?: string;
  locality?: string;
  radiusKm?: number;
  category?: string;
  skills?: string[];
  minSalary?: number;
  shift?: Shift[];
  urgency?: Urgency[];
  maxExperience?: number;
  perks?: ('accommodation' | 'food' | 'transport')[];
  q?: string;
  sort?: JobSort;
  page?: number;
  limit?: number;
  /** Defaults to the publicly visible statuses. */
  statuses?: JobStatus[];
}

export interface JobSearchResult {
  items: Job[];
  meta: PaginationMeta;
}

function dailySalary(job: Job): number {
  const { amount, type } = job.salary;
  if (type === 'PER_MONTH') return Math.round(amount / 26);
  if (type === 'PER_HOUR') return amount * 8;
  return amount;
}

function matchesQuery(job: Job, q: string): boolean {
  const haystack = [
    job.title,
    job.description,
    job.company.name,
    job.location.formatted,
    job.category.name,
    ...job.skills.flatMap((skill) => [skill.name, ...skill.aliases]),
  ]
    .join(' ')
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

function withDistance(list: Job[], citySlug?: string): Job[] {
  const origin = citySlug ? cityBySlug[citySlug]?.coordinates : undefined;
  if (!origin) return list;
  return list.map((job) => ({
    ...job,
    distanceKm: distanceKm(origin, job.location.geo.coordinates),
  }));
}

const URGENCY_WEIGHT: Record<Urgency, number> = { IMMEDIATE: 3, URGENT: 2, NORMAL: 1 };

const SORTERS: Record<JobSort, (a: Job, b: Job) => number> = {
  recent: (a, b) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt),
  nearest: (a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999),
  salary_desc: (a, b) => dailySalary(b) - dailySalary(a),
  urgent: (a, b) => URGENCY_WEIGHT[b.urgency] - URGENCY_WEIGHT[a.urgency],
  workers_needed: (a, b) => b.vacanciesLeft - a.vacanciesLeft,
};

export async function searchJobs(params: JobSearchParams = {}): Promise<JobSearchResult> {
  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(params.limit ?? LIMITS.pageSizeDefault, LIMITS.pageSizeMax);
  const radius = params.radiusKm ?? LIMITS.searchRadiusDefaultKm;
  const statuses = params.statuses ?? ['PUBLISHED', 'HIRING'];

  let list = withDistance(
    jobs.filter((job) => statuses.includes(job.status)),
    params.city,
  );

  if (params.city) {
    list = list.filter(
      (job) =>
        job.location.citySlug === params.city ||
        (job.distanceKm !== undefined && job.distanceKm <= radius),
    );
  }
  if (params.locality) {
    list = list.filter((job) => job.location.localitySlug === params.locality);
  }
  if (params.category) {
    list = list.filter((job) => job.category.slug === params.category);
  }
  if (params.skills?.length) {
    list = list.filter((job) => job.skills.some((skill) => params.skills?.includes(skill.slug)));
  }
  if (params.minSalary) {
    list = list.filter((job) => dailySalary(job) >= (params.minSalary ?? 0));
  }
  if (params.shift?.length) {
    list = list.filter((job) => params.shift?.includes(job.shift));
  }
  if (params.urgency?.length) {
    list = list.filter((job) => params.urgency?.includes(job.urgency));
  }
  if (params.maxExperience !== undefined) {
    list = list.filter((job) => job.experienceRequiredYears <= (params.maxExperience ?? 99));
  }
  if (params.perks?.length) {
    list = list.filter((job) => params.perks?.every((perk) => job.perks[perk]));
  }
  if (params.q?.trim()) {
    list = list.filter((job) => matchesQuery(job, params.q as string));
  }

  list.sort(SORTERS[params.sort ?? (params.city ? 'nearest' : 'recent')]);

  const total = list.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    items: list.slice((page - 1) * limit, page * limit),
    meta: { page, limit, total, totalPages, hasMore: page < totalPages },
  };
}

export async function getJob(slug: string): Promise<Job | null> {
  const job = jobs.find((item) => item.slug === slug);
  if (!job) return null;
  return {
    ...job,
    viewer: {
      hasApplied: false,
      hasSaved: savedJobSlugs.includes(job.slug),
    },
  };
}

export async function getSimilarJobs(job: Job, take = 4): Promise<Job[]> {
  const slugs = new Set(job.skills.map((skill) => skill.slug));
  return openJobs
    .filter(
      (candidate) =>
        candidate.id !== job.id &&
        (candidate.category.slug === job.category.slug ||
          candidate.skills.some((skill) => slugs.has(skill.slug))),
    )
    .slice(0, take);
}

/** Jobs matching the signed-in worker's skills, inside their preferred radius. */
export async function getRecommendedJobs(take = 6): Promise<Job[]> {
  const worker = currentWorker;
  const skillSlugs = new Set(worker.skills.map((entry) => entry.skill.slug));
  const origin = worker.location.geo.coordinates;

  return openJobs
    .map((job) => ({ ...job, distanceKm: distanceKm(origin, job.location.geo.coordinates) }))
    .filter((job) => job.skills.some((skill) => skillSlugs.has(skill.slug)))
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    .slice(0, take);
}

/** Everything inside the worker's chosen travel radius, nearest first. */
export async function getNearbyJobs(radiusKm?: number, take = 12): Promise<Job[]> {
  const worker = currentWorker;
  const radius = radiusKm ?? worker.workRadiusKm;
  const origin = worker.location.geo.coordinates;

  return openJobs
    .map((job) => ({ ...job, distanceKm: distanceKm(origin, job.location.geo.coordinates) }))
    .filter((job) => (job.distanceKm ?? Infinity) <= radius)
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    .slice(0, take);
}

export async function getUrgentJobs(take = 6): Promise<Job[]> {
  return openJobs
    .filter((job) => job.urgency !== 'NORMAL')
    .sort((a, b) => URGENCY_WEIGHT[b.urgency] - URGENCY_WEIGHT[a.urgency])
    .slice(0, take);
}

export async function getSavedJobs(): Promise<Job[]> {
  return jobs
    .filter((job) => savedJobSlugs.includes(job.slug))
    .map((job) => ({ ...job, viewer: { hasApplied: false, hasSaved: true } }));
}

export async function getJobCountsByCity(): Promise<Record<string, number>> {
  return openJobs.reduce<Record<string, number>>((counts, job) => {
    counts[job.location.citySlug] = (counts[job.location.citySlug] ?? 0) + 1;
    return counts;
  }, {});
}

export async function getJobCountsByCategory(): Promise<Record<string, number>> {
  return openJobs.reduce<Record<string, number>>((counts, job) => {
    counts[job.category.slug] = (counts[job.category.slug] ?? 0) + 1;
    return counts;
  }, {});
}

/** Latest open jobs, used on the landing page. */
export async function getLatestJobs(take = 6): Promise<Job[]> {
  return [...openJobs]
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    .slice(0, take);
}
