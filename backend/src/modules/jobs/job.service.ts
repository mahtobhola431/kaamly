import mongoose, { type PipelineStage } from 'mongoose';
import {
  JobStatus,
  OPEN_JOB_STATUSES,
  type CreateJobInput,
  type EmployerJobQueryInput,
  type GeoLocation,
  type Job,
  type JobSearchInput,
  type LocationInput,
  type UpdateJobInput,
} from '@rokdajob/shared';
import { ApiError } from '@/utils/api-error';
import { User, type UserDoc } from '@/modules/auth/user.model';
import { resolvePincode, resolvePlace } from '@/modules/catalog/catalog.service';
import { CategoryModel, toCategory } from '@/modules/catalog/category.model';
import { SkillModel, toSkill } from '@/modules/catalog/skill.model';
import { CompanyModel, toJobCompany, type CompanyDoc } from '@/modules/employer/company.model';
import { companyForOwner } from '@/modules/employer/employer.service';
import { JobModel, uniqueJobSlug, type JobDoc, type JobDocument } from './job.model';

async function resolveLocation(input: LocationInput): Promise<GeoLocation> {
  if (input.location) return input.location;
  if (input.pincode) return resolvePincode(input.pincode);
  if (input.citySlug) return resolvePlace(input.citySlug, input.localitySlug);
  throw ApiError.badRequest('Provide a site location, a pincode, or a city');
}

/** Loads the references a job carries so it goes out fully populated, never as ids. */
async function hydrate(job: JobDoc, employer: UserDoc, company: CompanyDoc): Promise<Job> {
  const [category, skills] = await Promise.all([
    CategoryModel.findById(job.category),
    SkillModel.find({ _id: { $in: job.skills } }),
  ]);
  if (!category) throw ApiError.internal('This job points at a category that no longer exists');

  const categoryIds = [...new Set(skills.map((skill) => skill.category.toString()))];
  const categories = await CategoryModel.find({ _id: { $in: categoryIds } });
  const categoryById = new Map(categories.map((doc) => [doc._id.toString(), doc]));

  return {
    id: job._id.toString(),
    title: job.title,
    slug: job.slug,
    employer: employer.toPublicUser(),
    company: toJobCompany(company),
    category: toCategory(category),
    skills: skills.flatMap((skill) => {
      const parent = categoryById.get(skill.category.toString());
      return parent ? [toSkill(skill, parent)] : [];
    }),
    description: job.description,
    workersRequired: job.workersRequired,
    hiredCount: job.hiredCount,
    vacanciesLeft: Math.max(job.workersRequired - job.hiredCount, 0),
    location: job.location,
    ...(job.startDate ? { startDate: job.startDate.toISOString() } : {}),
    ...(job.endDate ? { endDate: job.endDate.toISOString() } : {}),
    ...(job.durationDays ? { durationDays: job.durationDays } : {}),
    shift: job.shift,
    ...(job.workingHours?.from ? { workingHours: job.workingHours } : {}),
    salary: job.salary,
    perks: job.perks,
    experienceRequiredYears: job.experienceRequiredYears,
    urgency: job.urgency,
    contactPreference: job.contactPreference,
    status: job.status,
    ...(job.publishedAt ? { publishedAt: job.publishedAt.toISOString() } : {}),
    ...(job.expiresAt ? { expiresAt: job.expiresAt.toISOString() } : {}),
    viewCount: job.viewCount,
    applicationCount: job.applicationCount,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

/** Hydrates a page of jobs without one lookup per row. */
async function hydrateMany(jobs: JobDoc[]): Promise<Job[]> {
  if (jobs.length === 0) return [];

  const [employers, companies] = await Promise.all([
    User.find({ _id: { $in: jobs.map((job) => job.employer) } }),
    CompanyModel.find({ _id: { $in: jobs.map((job) => job.company) } }),
  ]);
  const employerById = new Map(employers.map((doc) => [doc._id.toString(), doc]));
  const companyById = new Map(companies.map((doc) => [doc._id.toString(), doc]));

  const out: Job[] = [];
  for (const job of jobs) {
    const employer = employerById.get(job.employer.toString());
    const company = companyById.get(job.company.toString());
    if (!employer || !company) continue;
    out.push(await hydrate(job, employer, company));
  }
  return out;
}

/* ------------------------------------------------------------------- employer */

export async function createJob(userId: string, input: CreateJobInput): Promise<Job> {
  const employer = await User.findOne({ _id: userId, deletedAt: null });
  if (!employer) throw ApiError.unauthenticated('Your account is no longer available');

  const company = await companyForOwner(employer);
  const location = await resolveLocation(input);
  const publishing = input.status === 'PUBLISHED';

  const job = await JobModel.create({
    employer: employer._id,
    company: company._id,
    title: input.title,
    slug: await uniqueJobSlug(input.title, location.citySlug),
    category: input.category,
    skills: input.skills,
    description: input.description,
    workersRequired: input.workersRequired,
    location,
    ...(input.startDate ? { startDate: input.startDate } : {}),
    ...(input.endDate ? { endDate: input.endDate } : {}),
    ...(input.durationDays ? { durationDays: input.durationDays } : {}),
    shift: input.shift,
    ...(input.workingHours ? { workingHours: input.workingHours } : {}),
    salary: input.salary,
    perks: input.perks,
    experienceRequiredYears: input.experienceRequiredYears,
    urgency: input.urgency,
    contactPreference: input.contactPreference,
    status: publishing ? JobStatus.PUBLISHED : JobStatus.DRAFT,
    ...(publishing ? { publishedAt: new Date() } : {}),
  });

  return hydrate(job, employer, company);
}

/** Loads a job the caller owns, or refuses. */
async function ownedJob(userId: string, jobId: string): Promise<JobDoc> {
  const job = await JobModel.findOne({ _id: jobId, deletedAt: null });
  if (!job) throw ApiError.notFound('Job');
  if (job.employer.toString() !== userId) {
    throw ApiError.forbidden('This job belongs to another account');
  }
  return job;
}

export async function updateJob(
  userId: string,
  jobId: string,
  input: UpdateJobInput,
): Promise<Job> {
  const job = await ownedJob(userId, jobId);

  if (input.location || input.pincode || input.citySlug) {
    job.location = await resolveLocation(input);
  }

  if (input.title !== undefined) job.title = input.title;
  if (input.description !== undefined) job.description = input.description;
  if (input.category !== undefined) job.category = new mongoose.Types.ObjectId(input.category);
  if (input.skills !== undefined) {
    job.skills = input.skills.map((id) => new mongoose.Types.ObjectId(id));
  }
  if (input.workersRequired !== undefined) job.workersRequired = input.workersRequired;
  if (input.startDate !== undefined) job.startDate = input.startDate;
  if (input.endDate !== undefined) job.endDate = input.endDate;
  if (input.durationDays !== undefined) job.durationDays = input.durationDays ?? undefined;
  if (input.shift !== undefined) job.shift = input.shift;
  if (input.workingHours !== undefined) job.workingHours = input.workingHours;
  if (input.salary !== undefined) job.salary = input.salary;
  if (input.perks !== undefined) job.perks = input.perks;
  if (input.experienceRequiredYears !== undefined) {
    job.experienceRequiredYears = input.experienceRequiredYears;
  }
  if (input.urgency !== undefined) job.urgency = input.urgency;
  if (input.contactPreference !== undefined) job.contactPreference = input.contactPreference;

  await job.save();

  const employer = await User.findById(job.employer);
  const company = await CompanyModel.findById(job.company);
  if (!employer || !company) throw ApiError.internal('This job is missing its employer');

  return hydrate(job, employer, company);
}

export async function setJobStatus(
  userId: string,
  jobId: string,
  status: JobStatus,
): Promise<Job> {
  const job = await ownedJob(userId, jobId);

  // Publishing for the first time is what starts the clock on the listing.
  if (status === JobStatus.PUBLISHED && !job.publishedAt) job.publishedAt = new Date();
  job.status = status;
  await job.save();

  const employer = await User.findById(job.employer);
  const company = await CompanyModel.findById(job.company);
  if (!employer || !company) throw ApiError.internal('This job is missing its employer');

  return hydrate(job, employer, company);
}

/** Soft delete: the row stays for the applications that reference it. */
export async function deleteJob(userId: string, jobId: string): Promise<void> {
  const job = await ownedJob(userId, jobId);
  job.deletedAt = new Date();
  job.status = JobStatus.CANCELLED;
  await job.save();
}

export async function listEmployerJobs(
  userId: string,
  query: EmployerJobQueryInput,
): Promise<{ items: Job[]; total: number }> {
  const filters: Record<string, unknown> = { employer: userId, deletedAt: null };
  if (query.status) filters.status = query.status;
  if (query.q) {
    filters.title = new RegExp(query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  const [jobs, total] = await Promise.all([
    JobModel.find(filters)
      .sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    JobModel.countDocuments(filters),
  ]);

  return { items: await hydrateMany(jobs), total };
}

/* --------------------------------------------------------------------- public */

export async function getJobBySlugOrId(idOrSlug: string): Promise<Job> {
  const query = mongoose.isValidObjectId(idOrSlug)
    ? { _id: idOrSlug, deletedAt: null }
    : { slug: idOrSlug, deletedAt: null };

  const job = await JobModel.findOne(query);
  if (!job) throw ApiError.notFound('Job');

  const [employer, company] = await Promise.all([
    User.findById(job.employer),
    CompanyModel.findById(job.company),
  ]);
  if (!employer || !company) throw ApiError.notFound('Job');

  // Fire-and-forget: a view counter must never fail a page render.
  void JobModel.updateOne({ _id: job._id }, { $inc: { viewCount: 1 } }).catch(() => undefined);

  return hydrate(job, employer, company);
}

export interface JobSearchResult {
  items: (Job & { distanceKm?: number })[];
  total: number;
}

/**
 * Public job search.
 *
 * Geography is optional: with coordinates, a pincode or a city it runs through
 * `$geoNear` with every filter inside the `query` option; without one it is an ordinary
 * indexed find, which is what makes a bare `/jobs` page cheap.
 */
export async function searchJobs(input: JobSearchInput): Promise<JobSearchResult> {
  const filters: Record<string, unknown> = {
    deletedAt: null,
    status: { $in: OPEN_JOB_STATUSES },
  };

  if (input.shift?.length) filters.shift = { $in: input.shift };
  if (input.urgency?.length) filters.urgency = { $in: input.urgency };
  if (input.salaryMin !== undefined) filters['salary.amount'] = { $gte: input.salaryMin };
  if (input.maxExperience !== undefined) {
    filters.experienceRequiredYears = { $lte: input.maxExperience };
  }
  // Perks are an AND: asking for food and transport means both, not either.
  for (const perk of input.perk ?? []) filters[`perks.${perk}`] = true;
  if (input.locality) filters['location.localitySlug'] = input.locality;

  if (input.skill?.length) {
    const skills = await SkillModel.find({ slug: { $in: input.skill } }, { _id: 1 });
    filters.skills = { $in: skills.map((doc) => doc._id) };
  }

  if (input.category) {
    const category = await CategoryModel.findOne({ slug: input.category });
    // An unknown category must match nothing rather than everything.
    filters.category = category?._id ?? new mongoose.Types.ObjectId();
  }

  if (input.q) {
    const pattern = new RegExp(input.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filters.$or = [{ title: pattern }, { description: pattern }];
  }

  const centre = await resolveSearchCentre(input);
  const skip = (input.page - 1) * input.limit;

  const SORTS: Record<JobSearchInput['sort'], Record<string, 1 | -1>> = {
    recent: { publishedAt: -1, createdAt: -1 },
    nearest: { distanceMeters: 1 },
    salary_desc: { 'salary.amount': -1 },
    urgent: { urgency: -1, publishedAt: -1 },
  };

  if (!centre) {
    // No origin: a plain indexed query, and "nearest" degrades to "recent".
    if (input.city) filters['location.citySlug'] = input.city;
    const sort = input.sort === 'nearest' ? SORTS.recent : SORTS[input.sort];

    const [jobs, total] = await Promise.all([
      JobModel.find(filters).sort(sort).skip(skip).limit(input.limit),
      JobModel.countDocuments(filters),
    ]);
    return { items: await hydrateMany(jobs), total };
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
    { $sort: SORTS[input.sort] },
    { $facet: { rows: [{ $skip: skip }, { $limit: input.limit }], total: [{ $count: 'value' }] } },
  ];

  const [result] = await JobModel.aggregate<{
    rows: (JobDocument & { distanceMeters: number })[];
    total: { value: number }[];
  }>(pipeline);

  const rows = result?.rows ?? [];
  const hydrated = await hydrateMany(rows.map((row) => JobModel.hydrate(row)));

  const distanceById = new Map(
    rows.map((row) => [row._id.toString(), Math.round((row.distanceMeters / 1000) * 10) / 10]),
  );

  return {
    items: hydrated.map((job) => ({ ...job, distanceKm: distanceById.get(job.id) })),
    total: result?.total[0]?.value ?? 0,
  };
}

async function resolveSearchCentre(input: JobSearchInput): Promise<[number, number] | null> {
  if (input.lat !== undefined && input.lng !== undefined) return [input.lng, input.lat];
  if (input.pincode) return (await resolvePincode(input.pincode)).geo.coordinates;
  if (input.city && input.locality) {
    return (await resolvePlace(input.city, input.locality)).geo.coordinates;
  }
  // A city on its own stays a plain equality filter, which is both cheaper and exact.
  return null;
}

/** Open jobs per city, for the locations hub and the SEO landing pages. */
export async function countByCity(): Promise<Record<string, number>> {
  const rows = await JobModel.aggregate<{ _id: string; count: number }>([
    { $match: { deletedAt: null, status: { $in: OPEN_JOB_STATUSES } } },
    { $group: { _id: '$location.citySlug', count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((row) => [row._id, row.count]));
}

/** Open jobs per category slug, for the category grid. */
export async function countByCategory(): Promise<Record<string, number>> {
  const rows = await JobModel.aggregate<{ _id: string; count: number }>([
    { $match: { deletedAt: null, status: { $in: OPEN_JOB_STATUSES } } },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryDoc',
      },
    },
    { $unwind: '$categoryDoc' },
    { $group: { _id: '$categoryDoc.slug', count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((row) => [row._id, row.count]));
}

/** City/category pairs that actually have open jobs, for `generateStaticParams`. */
export async function listSearchFacets(limit = 500): Promise<
  { city: string; category: string; count: number }[]
> {
  return JobModel.aggregate([
    { $match: { deletedAt: null, status: { $in: OPEN_JOB_STATUSES } } },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryDoc',
      },
    },
    { $unwind: '$categoryDoc' },
    {
      $group: {
        _id: { city: '$location.citySlug', category: '$categoryDoc.slug' },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: { _id: 0, city: '$_id.city', category: '$_id.category', count: 1 } },
  ]);
}
