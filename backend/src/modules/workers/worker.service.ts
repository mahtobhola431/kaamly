import mongoose, { type PipelineStage } from 'mongoose';
import {
  Availability,
  type CreateWorkerProfileInput,
  type GeoLocation,
  type LocationInput,
  type UpdateWorkerProfileInput,
  type WorkerProfile,
  type WorkerSearchInput,
} from '@rokdajob/shared';
import { ApiError } from '@/utils/api-error';
import { resolvePincode, resolvePlace } from '@/modules/catalog/catalog.service';
import { CategoryModel, toCategory } from '@/modules/catalog/category.model';
import { SkillModel, toSkill } from '@/modules/catalog/skill.model';
import { User, type UserDoc } from '@/modules/auth/user.model';
import {
  WorkerProfileModel,
  computeCompletion,
  type WorkerProfileDoc,
  type WorkerProfileDocument,
  type WorkerSkillEntry,
} from './worker-profile.model';

/**
 * Turns whichever location form the client sent into a stored `GeoLocation`.
 *
 * Accepting a pincode or a city slug and resolving it here means the coordinates always
 * come from our own `locations` collection, so two workers in the same locality are never
 * a kilometre apart because of client-side geocoding.
 */
async function resolveLocation(input: LocationInput): Promise<GeoLocation> {
  if (input.location) return input.location;
  if (input.pincode) return resolvePincode(input.pincode);
  if (input.citySlug) return resolvePlace(input.citySlug, input.localitySlug);
  throw ApiError.badRequest('Provide a location, a pincode, or a city');
}

/** Loads the referenced skills and categories so a profile can go out fully populated. */
async function hydrate(profile: WorkerProfileDoc, user: UserDoc): Promise<WorkerProfile> {
  const skillIds = profile.skills.map((entry) => entry.skill);
  const skills = await SkillModel.find({ _id: { $in: skillIds } });
  const categoryIds = [
    ...new Set([
      ...skills.map((skill) => skill.category.toString()),
      ...(profile.primaryCategory ? [profile.primaryCategory.toString()] : []),
    ]),
  ];
  const categories = await CategoryModel.find({ _id: { $in: categoryIds } });

  const skillById = new Map(skills.map((doc) => [doc._id.toString(), doc]));
  const categoryById = new Map(categories.map((doc) => [doc._id.toString(), doc]));

  const primary = profile.primaryCategory
    ? categoryById.get(profile.primaryCategory.toString())
    : undefined;

  return {
    id: profile._id.toString(),
    user: user.toPublicUser(),
    ...(profile.headline ? { headline: profile.headline } : {}),
    ...(profile.bio ? { bio: profile.bio } : {}),
    skills: profile.skills.flatMap((entry) => {
      const skill = skillById.get(entry.skill.toString());
      const category = skill ? categoryById.get(skill.category.toString()) : undefined;
      if (!skill || !category) return [];
      return [{ skill: toSkill(skill, category), years: entry.years, level: entry.level }];
    }),
    ...(primary ? { primaryCategory: toCategory(primary) } : {}),
    experienceYears: profile.experienceYears,
    location: profile.location,
    workRadiusKm: profile.workRadiusKm,
    expectedWage: profile.expectedWage,
    availability: profile.availability,
    ...(profile.availableFrom ? { availableFrom: profile.availableFrom.toISOString() } : {}),
    languages: profile.languages,
    ...(profile.gender ? { gender: profile.gender } : {}),
    ratingAvg: profile.ratingAvg,
    ratingCount: profile.ratingCount,
    completedJobs: profile.completedJobs,
    verification: profile.verification,
    profileCompletion: profile.profileCompletion,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

/** Wire skill entries carry string ids; the document needs real ObjectIds. */
function toSkillEntries(
  entries: { skill: string; years: number; level: WorkerSkillEntry['level'] }[],
): WorkerSkillEntry[] {
  return entries.map((entry) => ({
    skill: new mongoose.Types.ObjectId(entry.skill),
    years: entry.years,
    level: entry.level,
  }));
}

async function loadUser(userId: string): Promise<UserDoc> {
  const user = await User.findOne({ _id: userId, deletedAt: null });
  if (!user) throw ApiError.unauthenticated('Your account is no longer available');
  return user;
}

/* ------------------------------------------------------------------ own profile */

export async function getMyProfile(userId: string): Promise<WorkerProfile | null> {
  const profile = await WorkerProfileModel.findOne({ user: userId, deletedAt: null });
  if (!profile) return null;
  return hydrate(profile, await loadUser(userId));
}

export async function createProfile(
  userId: string,
  input: CreateWorkerProfileInput,
): Promise<WorkerProfile> {
  const existing = await WorkerProfileModel.findOne({ user: userId, deletedAt: null });
  if (existing) throw ApiError.conflict('You already have a profile. Edit it instead.');

  const user = await loadUser(userId);
  const location = await resolveLocation(input);

  const profile = new WorkerProfileModel({
    user: user._id,
    ...(input.headline ? { headline: input.headline } : {}),
    ...(input.bio ? { bio: input.bio } : {}),
    skills: toSkillEntries(input.skills),
    ...(input.primaryCategory ? { primaryCategory: input.primaryCategory } : {}),
    experienceYears: input.experienceYears,
    location,
    workRadiusKm: input.workRadiusKm,
    expectedWage: input.expectedWage,
    availability: input.availability,
    ...(input.availableFrom ? { availableFrom: input.availableFrom } : {}),
    languages: input.languages,
    ...(input.gender ? { gender: input.gender } : {}),
    ...(input.dateOfBirth ? { dateOfBirth: input.dateOfBirth } : {}),
    verification: { phone: Boolean(user.phoneVerifiedAt), profile: false, documents: false },
  });

  profile.profileCompletion = computeCompletion(profile);
  await profile.save();

  return hydrate(profile, user);
}

export async function updateProfile(
  userId: string,
  input: UpdateWorkerProfileInput,
): Promise<WorkerProfile> {
  const profile = await WorkerProfileModel.findOne({ user: userId, deletedAt: null });
  if (!profile) throw ApiError.notFound('Profile');

  if (input.location || input.pincode || input.citySlug) {
    profile.location = await resolveLocation(input);
  }

  // Written out rather than looped: each field has its own type, and a generic setter
  // over a Mongoose document erases them all to `never`.
  if (input.headline !== undefined) profile.headline = input.headline;
  if (input.bio !== undefined) profile.bio = input.bio;
  if (input.skills !== undefined) profile.skills = toSkillEntries(input.skills);
  if (input.experienceYears !== undefined) profile.experienceYears = input.experienceYears;
  if (input.workRadiusKm !== undefined) profile.workRadiusKm = input.workRadiusKm;
  if (input.expectedWage !== undefined) profile.expectedWage = input.expectedWage;
  if (input.availability !== undefined) profile.availability = input.availability;
  if (input.languages !== undefined) profile.languages = input.languages;
  if (input.gender !== undefined) profile.gender = input.gender;
  if (input.availableFrom !== undefined) profile.availableFrom = input.availableFrom;
  if (input.dateOfBirth !== undefined) profile.dateOfBirth = input.dateOfBirth;
  if (input.primaryCategory !== undefined) {
    profile.primaryCategory = new mongoose.Types.ObjectId(input.primaryCategory);
  }

  profile.profileCompletion = computeCompletion(profile);
  await profile.save();

  return hydrate(profile, await loadUser(userId));
}

export async function setAvailability(
  userId: string,
  availability: Availability,
  availableFrom?: Date,
): Promise<WorkerProfile> {
  const profile = await WorkerProfileModel.findOne({ user: userId, deletedAt: null });
  if (!profile) throw ApiError.notFound('Profile');

  profile.availability = availability;
  profile.availableFrom = availability === Availability.AVAILABLE_FROM ? (availableFrom ?? null) : null;
  await profile.save();

  return hydrate(profile, await loadUser(userId));
}

/* --------------------------------------------------------------- public profile */

export async function getPublicProfile(id: string): Promise<WorkerProfile> {
  const profile = await WorkerProfileModel.findOne({ _id: id, deletedAt: null });
  if (!profile) throw ApiError.notFound('Worker');

  const user = await User.findOne({ _id: profile.user, deletedAt: null });
  if (!user) throw ApiError.notFound('Worker');

  return hydrate(profile, user);
}

/* ----------------------------------------------------------------------- search */

export interface WorkerSearchResult {
  items: (WorkerProfile & { distanceKm?: number })[];
  total: number;
}

/**
 * Nearby worker search.
 *
 * `$geoNear` must be the first stage of the pipeline and cannot be preceded by a `$match`,
 * so every filter that can be expressed as a query goes inside its `query` option — that
 * is what keeps the 2dsphere index in play instead of scanning the collection
 * (docs/06-RISKS.md R1).
 */
export async function searchWorkers(input: WorkerSearchInput): Promise<WorkerSearchResult> {
  const centre = await resolveSearchCentre(input);

  const filters: Record<string, unknown> = { deletedAt: null };

  if (input.availability) filters.availability = input.availability;
  if (input.minExperience !== undefined) filters.experienceYears = { $gte: input.minExperience };
  if (input.maxWage !== undefined) filters['expectedWage.amount'] = { $lte: input.maxWage };
  if (input.minRating !== undefined) filters.ratingAvg = { $gte: input.minRating };
  if (input.verified) filters['verification.profile'] = true;
  if (input.language?.length) filters.languages = { $in: input.language };

  if (input.skill?.length) {
    const skills = await SkillModel.find({ slug: { $in: input.skill } }, { _id: 1 });
    // An unknown skill slug must match nothing, not everything.
    filters['skills.skill'] = { $in: skills.map((doc) => doc._id) };
  }

  if (input.category) {
    const category = await CategoryModel.findOne({ slug: input.category });
    if (category) {
      const skills = await SkillModel.find({ category: category._id }, { _id: 1 });
      filters['skills.skill'] = { $in: skills.map((doc) => doc._id) };
    } else {
      filters['skills.skill'] = { $in: [] };
    }
  }

  if (input.q) {
    const pattern = new RegExp(input.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filters.$or = [{ headline: pattern }, { bio: pattern }];
  }

  const pipeline: PipelineStage[] = [
    {
      $geoNear: {
        near: { type: 'Point', coordinates: centre },
        distanceField: 'distanceMeters',
        maxDistance: input.radiusKm * 1000,
        spherical: true,
        query: filters,
      },
    },
  ];

  const SORTS: Record<WorkerSearchInput['sort'], Record<string, 1 | -1>> = {
    nearest: { distanceMeters: 1 },
    rating: { ratingAvg: -1, ratingCount: -1 },
    experience: { experienceYears: -1 },
    wage_asc: { 'expectedWage.amount': 1 },
    available: { availability: 1, distanceMeters: 1 },
    recent: { updatedAt: -1 },
  };
  pipeline.push({ $sort: SORTS[input.sort] });

  const skip = (input.page - 1) * input.limit;
  pipeline.push({
    $facet: {
      rows: [{ $skip: skip }, { $limit: input.limit }],
      total: [{ $count: 'value' }],
    },
  });

  const [result] = await WorkerProfileModel.aggregate<{
    rows: (WorkerProfileDocument & { distanceMeters: number })[];
    total: { value: number }[];
  }>(pipeline);

  const rows = result?.rows ?? [];
  const total = result?.total[0]?.value ?? 0;

  const users = await User.find({ _id: { $in: rows.map((row) => row.user) }, deletedAt: null });
  const userById = new Map(users.map((doc) => [doc._id.toString(), doc]));

  const items = [];
  for (const row of rows) {
    const user = userById.get(row.user.toString());
    if (!user) continue;
    const hydrated = await hydrate(WorkerProfileModel.hydrate(row), user);
    items.push({ ...hydrated, distanceKm: Math.round((row.distanceMeters / 1000) * 10) / 10 });
  }

  return { items, total };
}

/** Coordinates to search from: explicit, or resolved from a pincode / city slug. */
async function resolveSearchCentre(input: WorkerSearchInput): Promise<[number, number]> {
  if (input.lat !== undefined && input.lng !== undefined) return [input.lng, input.lat];
  if (input.pincode) return (await resolvePincode(input.pincode)).geo.coordinates;
  if (input.city) return (await resolvePlace(input.city, input.locality)).geo.coordinates;

  throw ApiError.badRequest('Tell us where to search: coordinates, a pincode, or a city');
}

/** Worker totals per city, for the locations hub and the SEO landing pages. */
export async function countByCity(): Promise<Record<string, number>> {
  const rows = await WorkerProfileModel.aggregate<{ _id: string; count: number }>([
    { $match: { deletedAt: null } },
    { $group: { _id: '$location.citySlug', count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((row) => [row._id, row.count]));
}

export interface SearchFacet {
  city: string;
  skill: string;
  count: number;
}

/**
 * Every city/skill pair that actually has workers.
 *
 * The SEO pages need to know which combinations are worth rendering. Asking that with one
 * search request per combination is 15 x 39 round trips against a rate-limited endpoint;
 * this answers it with a single aggregation, and stays correct as the data grows.
 */
export async function listSearchFacets(limit = 500): Promise<SearchFacet[]> {
  return WorkerProfileModel.aggregate<SearchFacet>([
    { $match: { deletedAt: null } },
    { $unwind: '$skills' },
    {
      $lookup: {
        from: 'skills',
        localField: 'skills.skill',
        foreignField: '_id',
        as: 'skillDoc',
      },
    },
    { $unwind: '$skillDoc' },
    {
      $group: {
        _id: { city: '$location.citySlug', skill: '$skillDoc.slug' },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: { _id: 0, city: '$_id.city', skill: '$_id.skill', count: 1 } },
  ]);
}
