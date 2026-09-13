import {
  ApplicationStage,
  JobStatus,
  OPEN_JOB_STATUSES,
  UserRole,
  type Company,
  type EmployerProfile,
  type UpdateCompanyInput,
} from '@rokdajob/shared';
import { logger } from '@/config/logger';
import { ApiError } from '@/utils/api-error';
import { ApplicationModel } from '@/modules/applications/application.model';
import { User, type UserDoc } from '@/modules/auth/user.model';
import { resolvePincode, resolvePlace } from '@/modules/catalog/catalog.service';
import { JobModel } from '@/modules/jobs/job.model';
import { uploadImage } from '@/modules/uploads/upload.service';
import { CompanyModel, toCompany, uniqueCompanySlug, type CompanyDoc } from './company.model';

/**
 * Created on first use from the name captured at registration, so an approved contractor
 * can post immediately. Idempotent: concurrent first requests cannot make two companies.
 */
export async function companyForOwner(user: UserDoc): Promise<CompanyDoc> {
  if (user.role !== UserRole.EMPLOYER) {
    throw ApiError.forbidden('Only contractor accounts have a company');
  }

  const existing = await CompanyModel.findOne({ owner: user._id, deletedAt: null });
  if (existing) return existing;

  const name = user.companyName?.trim() || `${user.name}'s business`;
  const company = await CompanyModel.create({
    name,
    slug: await uniqueCompanySlug(name),
    owner: user._id,
  });

  logger.info(
    { userId: user._id.toString(), companyId: company._id.toString() },
    'Company created for contractor',
  );

  return company;
}

export async function getMyCompany(userId: string): Promise<Company> {
  const user = await User.findOne({ _id: userId, deletedAt: null });
  if (!user) throw ApiError.unauthenticated('Your account is no longer available');

  const company = await companyForOwner(user);
  const activeJobCount = await JobModel.countDocuments({
    company: company._id,
    deletedAt: null,
    status: { $in: OPEN_JOB_STATUSES },
  });

  return toCompany(company, activeJobCount);
}

/**
 * Two fields are guarded rather than written straight through:
 *   - renaming re-slugs, or public URLs keep the old name;
 *   - a changed GSTIN clears `verification.gstin`, since the badge belongs to the number
 *     an admin checked.
 */
export async function updateMyCompany(
  userId: string,
  input: UpdateCompanyInput,
): Promise<Company> {
  const user = await User.findOne({ _id: userId, deletedAt: null });
  if (!user) throw ApiError.unauthenticated('Your account is no longer available');

  const company = await companyForOwner(user);

  if (input.name !== undefined && input.name !== company.name) {
    company.name = input.name;
    company.slug = await uniqueCompanySlug(input.name);
    // Keep the account's copy in step; it seeds a company on first use.
    user.companyName = input.name;
    await user.save();
  }

  if (input.type !== undefined) company.type = input.type;
  // An empty string clears; undefined leaves alone.
  if (input.about !== undefined) company.about = input.about || undefined;
  if (input.size !== undefined) company.size = input.size || undefined;
  if (input.foundedYear !== undefined) company.foundedYear = input.foundedYear ?? undefined;

  if (input.gstin !== undefined) {
    const gstin = input.gstin || undefined;
    if (gstin !== company.gstin) {
      company.gstin = gstin;
      company.verification.gstin = false;
    }
  }

  if (input.location || input.pincode || input.citySlug) {
    company.location = input.location
      ? input.location
      : input.pincode
        ? await resolvePincode(input.pincode)
        : await resolvePlace(input.citySlug!, input.localitySlug);
  }

  await company.save();

  const activeJobCount = await JobModel.countDocuments({
    company: company._id,
    deletedAt: null,
    status: { $in: OPEN_JOB_STATUSES },
  });

  return toCompany(company, activeJobCount);
}

/** Replaces the company logo. The hosted file is overwritten, not accumulated. */
export async function setCompanyLogo(userId: string, file: Buffer): Promise<Company> {
  const user = await User.findOne({ _id: userId, deletedAt: null });
  if (!user) throw ApiError.unauthenticated('Your account is no longer available');

  const company = await companyForOwner(user);
  const image = await uploadImage(file, { kind: 'logo', ownerId: company._id.toString() });

  company.logoUrl = image.url;
  await company.save();

  return toCompany(company);
}

export async function getMyEmployerProfile(userId: string): Promise<EmployerProfile> {
  const user = await User.findOne({ _id: userId, deletedAt: null });
  if (!user) throw ApiError.unauthenticated('Your account is no longer available');

  const company = await companyForOwner(user);

  return {
    id: user._id.toString(),
    user: user.toPublicUser(),
    company: toCompany(company),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export interface EmployerDashboard {
  company: Company;
  jobs: { open: number; draft: number; filled: number; total: number };
  applications: { total: number; newThisWeek: number; shortlisted: number; hired: number };
  workersRequired: number;
  hiredCount: number;
}

/** Counted live rather than kept as running totals, so nothing goes stale. */
export async function getDashboard(userId: string): Promise<EmployerDashboard> {
  const user = await User.findOne({ _id: userId, deletedAt: null });
  if (!user) throw ApiError.unauthenticated('Your account is no longer available');

  const company = await companyForOwner(user);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [byStatus, totals, applications, newThisWeek] = await Promise.all([
    JobModel.aggregate<{ _id: JobStatus; count: number }>([
      { $match: { employer: user._id, deletedAt: null } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    JobModel.aggregate<{ required: number; hired: number; applications: number }>([
      { $match: { employer: user._id, deletedAt: null, status: { $in: OPEN_JOB_STATUSES } } },
      {
        $group: {
          _id: null,
          required: { $sum: '$workersRequired' },
          hired: { $sum: '$hiredCount' },
          applications: { $sum: '$applicationCount' },
        },
      },
    ]),
    ApplicationModel.aggregate<{ _id: ApplicationStage; count: number }>([
      { $match: { employer: user._id } },
      { $group: { _id: '$stage', count: { $sum: 1 } } },
    ]),
    ApplicationModel.countDocuments({ employer: user._id, createdAt: { $gte: weekAgo } }),
  ]);

  const counts = new Map(byStatus.map((row) => [row._id, row.count]));
  const byStage = new Map(applications.map((row) => [row._id, row.count]));
  const open =
    (counts.get(JobStatus.PUBLISHED) ?? 0) + (counts.get(JobStatus.HIRING) ?? 0);
  const total = byStatus.reduce((sum, row) => sum + row.count, 0);
  const summary = totals[0];

  return {
    company: toCompany(company, open),
    jobs: {
      open,
      draft: counts.get(JobStatus.DRAFT) ?? 0,
      filled: counts.get(JobStatus.FILLED) ?? 0,
      total,
    },
    applications: {
      total: applications.reduce((sum, row) => sum + row.count, 0),
      newThisWeek,
      shortlisted: byStage.get(ApplicationStage.SHORTLISTED) ?? 0,
      hired: byStage.get(ApplicationStage.HIRED) ?? 0,
    },
    workersRequired: summary?.required ?? 0,
    hiredCount: summary?.hired ?? 0,
  };
}

/** Stage labels the pipeline board renders, so an empty board still has its columns. */
export const PIPELINE_COLUMNS = Object.values(ApplicationStage);
