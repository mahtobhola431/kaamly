import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import { CompanyType, type Company, type GeoLocation, type Job } from '@rokdajob/shared';
import { geoLocationSchema } from '@/database/schemas/geo-location.schema';

/**
 * The business a contractor hires for.
 *
 * Created from the company name captured at registration, so an approved contractor
 * always has one to post jobs against rather than being sent through a second form.
 */
export interface CompanyDocument {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  type: CompanyType;
  about?: string;
  logoUrl?: string;
  gstin?: string;
  size?: string;
  foundedYear?: number;
  location?: GeoLocation;
  verification: { company: boolean; gstin: boolean };
  ratingAvg: number;
  ratingCount: number;
  owner: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CompanyDoc = HydratedDocument<CompanyDocument>;

const companySchema = new Schema<CompanyDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    type: {
      type: String,
      enum: Object.values(CompanyType),
      required: true,
      default: CompanyType.CONTRACTOR,
    },
    about: { type: String, trim: true, maxlength: 2000 },
    logoUrl: { type: String, trim: true },
    gstin: { type: String, trim: true, uppercase: true, maxlength: 15 },
    size: { type: String, trim: true, maxlength: 40 },
    foundedYear: { type: Number, min: 1800, max: 2100 },
    location: { type: geoLocationSchema },
    verification: {
      company: { type: Boolean, required: true, default: false },
      gstin: { type: Boolean, required: true, default: false },
    },
    ratingAvg: { type: Number, required: true, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, required: true, default: 0 },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

companySchema.index({ slug: 1 }, { unique: true });
companySchema.index({ owner: 1 });
companySchema.index({ 'location.geo': '2dsphere' });
companySchema.index({ 'location.citySlug': 1 });

export const CompanyModel = model<CompanyDocument, Model<CompanyDocument>>(
  'Company',
  companySchema,
);

export function toCompany(doc: CompanyDoc, activeJobCount?: number): Company {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    type: doc.type,
    ...(doc.about ? { about: doc.about } : {}),
    ...(doc.logoUrl ? { logoUrl: doc.logoUrl } : {}),
    ...(doc.size ? { size: doc.size } : {}),
    ...(doc.foundedYear ? { foundedYear: doc.foundedYear } : {}),
    ...(doc.location ? { location: doc.location } : {}),
    // Owner-only: every caller of this helper is a `/employer/*` route on their own record.
    ...(doc.gstin ? { gstin: doc.gstin } : {}),
    verification: doc.verification,
    ratingAvg: doc.ratingAvg,
    ratingCount: doc.ratingCount,
    ...(activeJobCount === undefined ? {} : { activeJobCount }),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/** The trimmed company a job card carries. */
export function toJobCompany(doc: CompanyDoc): Job['company'] {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    ...(doc.logoUrl ? { logoUrl: doc.logoUrl } : {}),
    type: doc.type,
    verification: doc.verification,
  };
}

/** Slug from a company name, made unique with a short suffix when it collides. */
export async function uniqueCompanySlug(name: string): Promise<string> {
  const base =
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'company';

  if (!(await CompanyModel.exists({ slug: base }))) return base;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = `${base}-${Math.floor(100 + Math.random() * 900)}`;
    if (!(await CompanyModel.exists({ slug: candidate }))) return candidate;
  }

  return `${base}-${Date.now().toString(36)}`;
}
