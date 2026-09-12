import type { Availability, Shift, Urgency } from '@rokdajob/shared';
import type { JobSearchParams, JobSort } from '@/lib/data/jobs';
import type { WorkerSearchParams, WorkerSort } from '@/lib/data/workers';

/**
 * URL search params are the source of truth for every filtered view, so parsing them
 * lives here rather than in each page. When the API is live, the same parsed object is
 * handed straight to `api.list()` as the query.
 */

export type RawSearchParams = Record<string, string | string[] | undefined>;

function one(raw: RawSearchParams, key: string): string | undefined {
  const value = raw[key];
  const first = Array.isArray(value) ? value[0] : value;
  return first && first.length > 0 ? first : undefined;
}

function many(raw: RawSearchParams, key: string): string[] {
  const value = raw[key];
  if (!value) return [];
  return (Array.isArray(value) ? value : [value])
    .flatMap((item) => item.split(','))
    .filter(Boolean);
}

export function parseWorkerParams(raw: RawSearchParams, limit = 12): WorkerSearchParams {
  const params: WorkerSearchParams = { page: Number(one(raw, 'page') ?? 1), limit };

  const city = one(raw, 'city');
  if (city) params.city = city;
  const locality = one(raw, 'locality');
  if (locality) params.locality = locality;
  const radius = one(raw, 'radius');
  if (radius) params.radiusKm = Number(radius);
  const category = one(raw, 'category');
  if (category) params.category = category;
  const q = one(raw, 'q');
  if (q) params.q = q;

  const skills = many(raw, 'skill');
  if (skills.length) params.skills = skills;
  const availability = many(raw, 'availability') as Availability[];
  if (availability.length) params.availability = availability;
  const languages = many(raw, 'language');
  if (languages.length) params.languages = languages;

  const minExperience = one(raw, 'minExperience');
  if (minExperience) params.minExperience = Number(minExperience);
  const minRating = one(raw, 'minRating');
  if (minRating) params.minRating = Number(minRating);
  const maxWage = one(raw, 'maxWage');
  if (maxWage) params.maxWage = Number(maxWage);
  if (many(raw, 'verified').includes('profile')) params.verifiedOnly = true;

  const sort = one(raw, 'sort');
  if (sort) params.sort = sort as WorkerSort;

  return params;
}

export function parseJobParams(raw: RawSearchParams, limit = 12): JobSearchParams {
  const params: JobSearchParams = { page: Number(one(raw, 'page') ?? 1), limit };

  const city = one(raw, 'city');
  if (city) params.city = city;
  const locality = one(raw, 'locality');
  if (locality) params.locality = locality;
  const radius = one(raw, 'radius');
  if (radius) params.radiusKm = Number(radius);
  const category = one(raw, 'category');
  if (category) params.category = category;
  const q = one(raw, 'q');
  if (q) params.q = q;

  const skills = many(raw, 'skill');
  if (skills.length) params.skills = skills;
  const shift = many(raw, 'shift') as Shift[];
  if (shift.length) params.shift = shift;
  const urgency = many(raw, 'urgency') as Urgency[];
  if (urgency.length) params.urgency = urgency;
  const perks = many(raw, 'perk') as ('accommodation' | 'food' | 'transport')[];
  if (perks.length) params.perks = perks;

  const minSalary = one(raw, 'minSalary');
  if (minSalary) params.minSalary = Number(minSalary);
  const maxExperience = one(raw, 'maxExperience');
  if (maxExperience) params.maxExperience = Number(maxExperience);

  const sort = one(raw, 'sort');
  if (sort) params.sort = sort as JobSort;

  return params;
}
