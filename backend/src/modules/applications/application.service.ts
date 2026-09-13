import mongoose from 'mongoose';
import {
  ALLOWED_STAGE_TRANSITIONS,
  ApiErrorCode,
  ApplicationSource,
  ApplicationStage,
  JobStatus,
  OPEN_JOB_STATUSES,
  PIPELINE_STAGES,
  type Application,
  type ApplicationStageInput,
  type ApplyToJobInput,
  type EmployerApplicationQueryInput,
  type MyApplicationQueryInput,
} from '@rokdajob/shared';
import { ApiError } from '@/utils/api-error';
import { User, type UserDoc } from '@/modules/auth/user.model';
import { JobModel, type JobDoc } from '@/modules/jobs/job.model';
import { WorkerProfileModel } from '@/modules/workers/worker-profile.model';
import {
  ApplicationModel,
  CLOSED_STAGES,
  isDuplicateKey,
  type ApplicationDoc,
} from './application.model';

/**
 * Applications, and the pipeline an employer moves them along.
 *
 * Two rules from docs/06-RISKS.md:
 *   R4 — one application per worker per job, enforced by the `{job, worker}` unique index.
 *   R5 — the last vacancy goes to exactly one person, enforced by a guarded `updateOne`.
 */

/* ----------------------------------------------------------------- hydration */

type JobSummary = Application['job'];

function toJobSummary(job: JobDoc): JobSummary {
  return {
    id: job._id.toString(),
    title: job.title,
    slug: job.slug,
    location: job.location,
    salary: job.salary,
    status: job.status,
    workersRequired: job.workersRequired,
  };
}

interface HydrationContext {
  jobById: Map<string, JobSummary>;
  userById: Map<string, UserDoc>;
}

function hydrate(application: ApplicationDoc, context: HydrationContext): Application | null {
  const job = context.jobById.get(application.job.toString());
  const worker = context.userById.get(application.worker.toString());
  const employer = context.userById.get(application.employer.toString());
  if (!job || !worker || !employer) return null;

  return {
    id: application._id.toString(),
    job,
    worker: worker.toPublicUser(),
    employer: employer.toPublicUser(),
    stage: application.stage,
    source: application.source,
    ...(application.coverNote ? { coverNote: application.coverNote } : {}),
    ...(application.expectedWage ? { expectedWage: application.expectedWage } : {}),
    stageHistory: application.stageHistory.map((event) => ({
      stage: event.stage,
      at: event.at.toISOString(),
      ...(event.by ? { by: context.userById.get(event.by.toString())?.toPublicUser() } : {}),
      ...(event.note ? { note: event.note } : {}),
    })),
    ...(application.rejectionReason ? { rejectionReason: application.rejectionReason } : {}),
    ...(application.hiredAt ? { hiredAt: application.hiredAt.toISOString() } : {}),
    ...(application.withdrawnAt ? { withdrawnAt: application.withdrawnAt.toISOString() } : {}),
    ...(application.conversation ? { conversationId: application.conversation.toString() } : {}),
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  };
}

/** Loads every job and user a page of applications refers to, in two queries. */
async function hydrateMany(applications: ApplicationDoc[]): Promise<Application[]> {
  if (applications.length === 0) return [];

  const jobIds = new Set(applications.map((row) => row.job.toString()));
  const userIds = new Set<string>();
  for (const row of applications) {
    userIds.add(row.worker.toString());
    userIds.add(row.employer.toString());
    for (const event of row.stageHistory) if (event.by) userIds.add(event.by.toString());
  }

  const [jobs, users] = await Promise.all([
    JobModel.find({ _id: { $in: [...jobIds] } }),
    User.find({ _id: { $in: [...userIds] } }),
  ]);

  const context: HydrationContext = {
    jobById: new Map(jobs.map((job) => [job._id.toString(), toJobSummary(job)])),
    userById: new Map(users.map((user) => [user._id.toString(), user])),
  };

  return applications.flatMap((row) => {
    const application = hydrate(row, context);
    return application ? [application] : [];
  });
}

async function hydrateOne(application: ApplicationDoc): Promise<Application> {
  const [hydrated] = await hydrateMany([application]);
  if (!hydrated) throw ApiError.internal('This application is missing its job or its people');
  return hydrated;
}

/* ------------------------------------------------------------------- applying */

/**
 * Idempotent: an existing live application is returned as-is, so a retried request is not
 * an error. A withdrawn one is revived.
 */
export async function applyToJob(
  userId: string,
  jobId: string,
  input: ApplyToJobInput,
): Promise<{ application: Application; created: boolean }> {
  const worker = await User.findOne({ _id: userId, deletedAt: null });
  if (!worker) throw ApiError.unauthenticated('Your account is no longer available');

  const job = await JobModel.findOne({ _id: jobId, deletedAt: null });
  if (!job) throw ApiError.notFound('Job');

  if (job.employer.toString() === userId) {
    throw ApiError.forbidden('You cannot apply to your own job');
  }
  if (!OPEN_JOB_STATUSES.includes(job.status)) {
    throw ApiError.unprocessable(
      ApiErrorCode.JOB_NOT_OPEN,
      'This job is no longer accepting applications',
    );
  }
  if (job.hiredCount >= job.workersRequired) {
    throw ApiError.unprocessable(
      ApiErrorCode.VACANCIES_FULL,
      'Every position on this job has been filled',
    );
  }
  if (job.expiresAt && job.expiresAt.getTime() < Date.now()) {
    throw ApiError.unprocessable(ApiErrorCode.JOB_NOT_OPEN, 'This listing has expired');
  }

  // Save a phone given here, so it is only ever asked for once.
  if (input.phone && !worker.phone) {
    worker.phone = input.phone;
    await worker.save();
  }

  const profile = await WorkerProfileModel.findOne({ user: worker._id, deletedAt: null });

  const existing = await ApplicationModel.findOne({ job: job._id, worker: worker._id });
  if (existing) {
    if (existing.stage !== ApplicationStage.WITHDRAWN) {
      return { application: await hydrateOne(existing), created: false };
    }

    existing.stage = ApplicationStage.APPLIED;
    existing.withdrawnAt = null;
    existing.stageHistory.push({ stage: ApplicationStage.APPLIED, at: new Date(), by: worker._id });
    if (input.coverNote !== undefined) existing.coverNote = input.coverNote;
    if (input.expectedWage !== undefined) existing.expectedWage = input.expectedWage;
    if (profile) existing.workerProfile = profile._id;
    await existing.save();

    await JobModel.updateOne({ _id: job._id }, { $inc: { applicationCount: 1 } });
    return { application: await hydrateOne(existing), created: true };
  }

  let application: ApplicationDoc;
  try {
    application = await ApplicationModel.create({
      job: job._id,
      worker: worker._id,
      ...(profile ? { workerProfile: profile._id } : {}),
      employer: job.employer,
      company: job.company,
      stage: ApplicationStage.APPLIED,
      source: ApplicationSource.APPLIED,
      ...(input.coverNote ? { coverNote: input.coverNote } : {}),
      ...(input.expectedWage ? { expectedWage: input.expectedWage } : {}),
      stageHistory: [{ stage: ApplicationStage.APPLIED, at: new Date(), by: worker._id }],
    });
  } catch (error) {
    // Two taps raced past the read above; the index caught the second.
    if (!isDuplicateKey(error)) throw error;

    const raced = await ApplicationModel.findOne({ job: job._id, worker: worker._id });
    if (!raced) throw error;
    return { application: await hydrateOne(raced), created: false };
  }

  await JobModel.updateOne({ _id: job._id }, { $inc: { applicationCount: 1 } });

  return { application: await hydrateOne(application), created: true };
}

/** The caller's own application to one job, or `null`. Drives the apply button's state. */
export async function myApplicationForJob(
  userId: string,
  jobIdOrSlug: string,
): Promise<Application | null> {
  const job = await JobModel.findOne(
    mongoose.isValidObjectId(jobIdOrSlug)
      ? { _id: jobIdOrSlug, deletedAt: null }
      : { slug: jobIdOrSlug, deletedAt: null },
    { _id: 1 },
  );
  if (!job) return null;

  const application = await ApplicationModel.findOne({ job: job._id, worker: userId });
  return application ? hydrateOne(application) : null;
}

/**
 * Withdrawing keeps the row: the employer should see that someone pulled out, and the
 * unique index needs it to stay so a re-apply reuses it.
 */
export async function withdrawApplication(
  userId: string,
  applicationId: string,
  reason?: string,
): Promise<Application> {
  const application = await ApplicationModel.findById(applicationId);
  if (!application) throw ApiError.notFound('Application');
  if (application.worker.toString() !== userId) {
    throw ApiError.forbidden('This application belongs to someone else');
  }
  if (application.stage === ApplicationStage.WITHDRAWN) {
    return hydrateOne(application);
  }
  if (application.stage === ApplicationStage.HIRED) {
    throw ApiError.conflict('You have already been hired for this job — message the employer');
  }

  const wasCounted = !CLOSED_STAGES.includes(application.stage);

  application.stage = ApplicationStage.WITHDRAWN;
  application.withdrawnAt = new Date();
  application.stageHistory.push({
    stage: ApplicationStage.WITHDRAWN,
    at: new Date(),
    by: new mongoose.Types.ObjectId(userId),
    ...(reason ? { note: reason } : {}),
  });
  await application.save();

  if (wasCounted) {
    await JobModel.updateOne(
      { _id: application.job, applicationCount: { $gt: 0 } },
      { $inc: { applicationCount: -1 } },
    );
  }

  return hydrateOne(application);
}

/* -------------------------------------------------------------- worker's list */

export async function listMyApplications(
  userId: string,
  query: MyApplicationQueryInput,
): Promise<{ items: Application[]; total: number }> {
  const filters: Record<string, unknown> = { worker: userId };
  if (query.stage) filters.stage = query.stage;
  else if (query.active) filters.stage = { $nin: CLOSED_STAGES };

  const [rows, total] = await Promise.all([
    ApplicationModel.find(filters)
      .sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    ApplicationModel.countDocuments(filters),
  ]);

  return { items: await hydrateMany(rows), total };
}

/** Counts per stage, so a tab bar needs no second call. */
export async function myApplicationCounts(userId: string): Promise<Record<string, number>> {
  const rows = await ApplicationModel.aggregate<{ _id: ApplicationStage; count: number }>([
    { $match: { worker: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: '$stage', count: { $sum: 1 } } },
  ]);

  const counts: Record<string, number> = Object.fromEntries(
    Object.values(ApplicationStage).map((stage) => [stage, 0]),
  );
  for (const row of rows) counts[row._id] = row.count;
  counts.total = rows.reduce((sum, row) => sum + row.count, 0);
  return counts;
}

/* ------------------------------------------------------------ employer's board */

/** Loads an application on a job the caller owns, or refuses. */
async function ownedApplication(userId: string, applicationId: string): Promise<ApplicationDoc> {
  const application = await ApplicationModel.findById(applicationId);
  if (!application) throw ApiError.notFound('Application');
  if (application.employer.toString() !== userId) {
    throw ApiError.forbidden('This application is on another employer’s job');
  }
  return application;
}

export async function listEmployerApplications(
  userId: string,
  query: EmployerApplicationQueryInput,
): Promise<{ items: Application[]; total: number }> {
  const filters: Record<string, unknown> = { employer: userId };
  if (query.stage) filters.stage = query.stage;
  if (query.job) filters.job = query.job;

  // No join available, so resolve names to ids first.
  if (query.q) {
    const pattern = new RegExp(query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const matches = await User.find({ name: pattern }, { _id: 1 }).limit(200);
    filters.worker = { $in: matches.map((user) => user._id) };
  }

  const sort: Record<string, 1 | -1> =
    query.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

  const [rows, total] = await Promise.all([
    ApplicationModel.find(filters)
      .sort(sort)
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    ApplicationModel.countDocuments(filters),
  ]);

  return { items: await hydrateMany(rows), total };
}

/** Applicants on one job, for the job's own applicants screen. */
export async function listJobApplications(
  userId: string,
  jobId: string,
  query: EmployerApplicationQueryInput,
): Promise<{ items: Application[]; total: number }> {
  const job = await JobModel.findOne({ _id: jobId, deletedAt: null });
  if (!job) throw ApiError.notFound('Job');
  if (job.employer.toString() !== userId) {
    throw ApiError.forbidden('This job belongs to another account');
  }

  return listEmployerApplications(userId, { ...query, job: job._id.toString() });
}

/** Stage counts for the pipeline board's column headers. */
export async function employerPipelineCounts(
  userId: string,
  jobId?: string,
): Promise<Record<string, number>> {
  const match: Record<string, unknown> = { employer: new mongoose.Types.ObjectId(userId) };
  if (jobId) match.job = new mongoose.Types.ObjectId(jobId);

  const rows = await ApplicationModel.aggregate<{ _id: ApplicationStage; count: number }>([
    { $match: match },
    { $group: { _id: '$stage', count: { $sum: 1 } } },
  ]);

  const counts: Record<string, number> = Object.fromEntries(
    PIPELINE_STAGES.map((stage) => [stage, 0]),
  );
  for (const row of rows) counts[row._id] = row.count;
  counts.total = rows.reduce((sum, row) => sum + row.count, 0);
  return counts;
}

export async function setStage(
  userId: string,
  applicationId: string,
  input: ApplicationStageInput,
): Promise<Application> {
  const application = await ownedApplication(userId, applicationId);

  if (application.stage === ApplicationStage.WITHDRAWN) {
    throw ApiError.conflict('This worker withdrew their application');
  }
  if (application.stage === ApplicationStage.HIRED) {
    throw ApiError.conflict('This worker is already hired for this job');
  }
  if (application.stage === input.stage) {
    return hydrateOne(application);
  }

  // The same table the board renders its menu from.
  if (!ALLOWED_STAGE_TRANSITIONS[application.stage].includes(input.stage)) {
    throw ApiError.conflict(
      `Cannot move an application from ${application.stage} to ${input.stage}`,
    );
  }

  application.stage = input.stage;
  application.stageHistory.push({
    stage: input.stage,
    at: new Date(),
    by: new mongoose.Types.ObjectId(userId),
    ...(input.note ? { note: input.note } : {}),
  });
  await application.save();

  return hydrateOne(application);
}

/**
 * The vacancy is claimed by one conditional update: `$expr` compares `hiredCount` with
 * `workersRequired` in the same atomic operation that increments it, so of two requests
 * for the last position exactly one matches and the other gets `VACANCIES_FULL` (R5).
 */
export async function hireApplicant(
  userId: string,
  applicationId: string,
  note?: string,
): Promise<Application> {
  const application = await ownedApplication(userId, applicationId);

  if (application.stage === ApplicationStage.HIRED) return hydrateOne(application);
  if (application.stage === ApplicationStage.WITHDRAWN) {
    throw ApiError.conflict('This worker withdrew their application');
  }

  const claimed = await JobModel.updateOne(
    {
      _id: application.job,
      deletedAt: null,
      $expr: { $lt: ['$hiredCount', '$workersRequired'] },
    },
    { $inc: { hiredCount: 1 } },
  );

  if (claimed.modifiedCount === 0) {
    throw ApiError.unprocessable(
      ApiErrorCode.VACANCIES_FULL,
      'Every position on this job has already been filled',
    );
  }

  application.stage = ApplicationStage.HIRED;
  application.hiredAt = new Date();
  application.stageHistory.push({
    stage: ApplicationStage.HIRED,
    at: application.hiredAt,
    by: new mongoose.Types.ObjectId(userId),
    ...(note ? { note } : {}),
  });

  try {
    await application.save();
  } catch (error) {
    // The vacancy was claimed but not recorded; give it back.
    await JobModel.updateOne({ _id: application.job }, { $inc: { hiredCount: -1 } });
    throw error;
  }

  // The last vacancy closes the listing.
  await JobModel.updateOne(
    {
      _id: application.job,
      status: { $in: OPEN_JOB_STATUSES },
      $expr: { $gte: ['$hiredCount', '$workersRequired'] },
    },
    { $set: { status: JobStatus.FILLED } },
  );

  return hydrateOne(application);
}

export async function rejectApplicant(
  userId: string,
  applicationId: string,
  reason: string,
): Promise<Application> {
  const application = await ownedApplication(userId, applicationId);

  if (application.stage === ApplicationStage.WITHDRAWN) {
    throw ApiError.conflict('This worker withdrew their application');
  }

  const wasHired = application.stage === ApplicationStage.HIRED;

  application.stage = ApplicationStage.REJECTED;
  application.rejectionReason = reason;
  application.hiredAt = null;
  application.stageHistory.push({
    stage: ApplicationStage.REJECTED,
    at: new Date(),
    by: new mongoose.Types.ObjectId(userId),
    note: reason,
  });
  await application.save();

  // Letting a hired worker go returns their position and reopens the listing.
  if (wasHired) {
    await JobModel.updateOne(
      { _id: application.job, hiredCount: { $gt: 0 } },
      { $inc: { hiredCount: -1 } },
    );
    await JobModel.updateOne(
      {
        _id: application.job,
        status: JobStatus.FILLED,
        $expr: { $lt: ['$hiredCount', '$workersRequired'] },
      },
      { $set: { status: JobStatus.HIRING } },
    );
  }

  return hydrateOne(application);
}
