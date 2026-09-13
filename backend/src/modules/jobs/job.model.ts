import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import {
  ContactPreference,
  JobStatus,
  Shift,
  Urgency,
  type GeoLocation,
  type Wage,
} from '@rokdajob/shared';
import { geoLocationSchema, wageSchema } from '@/database/schemas/geo-location.schema';

/**
 * A posting. Only an approved contractor can create one.
 *
 * `hiredCount` lives here rather than being counted from applications, so the "last
 * vacancy" race is decided by a single guarded update on this document
 * (docs/06-RISKS.md R5).
 */
export interface JobDocument {
  _id: Types.ObjectId;
  employer: Types.ObjectId;
  company: Types.ObjectId;
  title: string;
  slug: string;
  category: Types.ObjectId;
  skills: Types.ObjectId[];
  description: string;
  workersRequired: number;
  hiredCount: number;
  location: GeoLocation;
  startDate?: Date | null;
  endDate?: Date | null;
  durationDays?: number;
  shift: Shift;
  workingHours?: { from: string; to: string };
  salary: Wage;
  perks: { accommodation: boolean; food: boolean; transport: boolean };
  experienceRequiredYears: number;
  urgency: Urgency;
  contactPreference: ContactPreference;
  status: JobStatus;
  publishedAt?: Date | null;
  expiresAt?: Date | null;
  viewCount: number;
  applicationCount: number;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type JobDoc = HydratedDocument<JobDocument>;

const jobSchema = new Schema<JobDocument>(
  {
    employer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    skills: { type: [Schema.Types.ObjectId], ref: 'Skill', default: [] },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    workersRequired: { type: Number, required: true, min: 1, max: 500, default: 1 },
    hiredCount: { type: Number, required: true, min: 0, default: 0 },
    location: { type: geoLocationSchema, required: true },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    durationDays: { type: Number, min: 1, max: 3650 },
    shift: { type: String, enum: Object.values(Shift), required: true, default: Shift.DAY },
    workingHours: {
      from: { type: String, trim: true },
      to: { type: String, trim: true },
    },
    salary: { type: wageSchema, required: true },
    perks: {
      accommodation: { type: Boolean, required: true, default: false },
      food: { type: Boolean, required: true, default: false },
      transport: { type: Boolean, required: true, default: false },
    },
    experienceRequiredYears: { type: Number, required: true, min: 0, max: 60, default: 0 },
    urgency: { type: String, enum: Object.values(Urgency), required: true, default: Urgency.NORMAL },
    contactPreference: {
      type: String,
      enum: Object.values(ContactPreference),
      required: true,
      default: ContactPreference.IN_APP,
    },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      required: true,
      default: JobStatus.DRAFT,
    },
    publishedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    viewCount: { type: Number, required: true, default: 0 },
    applicationCount: { type: Number, required: true, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

jobSchema.index({ slug: 1 }, { unique: true });
/** Public search runs through this; `$geoNear` cannot work without it. */
jobSchema.index({ 'location.geo': '2dsphere' });
jobSchema.index({ status: 1, publishedAt: -1 });
jobSchema.index({ employer: 1, status: 1, createdAt: -1 });
jobSchema.index({ category: 1, status: 1 });
jobSchema.index({ skills: 1, status: 1 });
/** The SEO landing pages: city + category + open. */
jobSchema.index({ 'location.citySlug': 1, category: 1, status: 1 });
jobSchema.index({ urgency: 1, publishedAt: -1 });
jobSchema.index({ expiresAt: 1 });

export const JobModel = model<JobDocument, Model<JobDocument>>('Job', jobSchema);

/** Slug from a title plus the city, made unique with a short suffix when it collides. */
export async function uniqueJobSlug(title: string, citySlug: string): Promise<string> {
  const base =
    `${title} ${citySlug}`
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'job';

  if (!(await JobModel.exists({ slug: base }))) return base;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = `${base}-${Math.floor(100 + Math.random() * 900)}`;
    if (!(await JobModel.exists({ slug: candidate }))) return candidate;
  }

  return `${base}-${Date.now().toString(36)}`;
}
