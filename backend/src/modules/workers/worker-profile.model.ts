import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import {
  Availability,
  Gender,
  SkillLevel,
  type GeoLocation,
  type Wage,
} from '@rokdajob/shared';
import { geoLocationSchema, wageSchema } from '@/database/schemas/geo-location.schema';

/**
 * A worker's public-facing profile. One per user, created during onboarding.
 *
 * The account (`users`) and the profile are deliberately separate: a worker can register
 * and look around before committing to a profile, and the profile carries everything that
 * is searchable while the account carries everything that is private.
 */
export interface WorkerSkillEntry {
  skill: Types.ObjectId;
  years: number;
  level: SkillLevel;
}

export interface WorkerProfileDocument {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  headline?: string;
  bio?: string;
  skills: WorkerSkillEntry[];
  primaryCategory?: Types.ObjectId;
  experienceYears: number;
  location: GeoLocation;
  /** How far the worker will travel for work. */
  workRadiusKm: number;
  expectedWage: Wage;
  availability: Availability;
  availableFrom?: Date | null;
  languages: string[];
  gender?: Gender;
  dateOfBirth?: Date | null;
  ratingAvg: number;
  ratingCount: number;
  completedJobs: number;
  verification: { phone: boolean; profile: boolean; documents: boolean };
  profileCompletion: number;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type WorkerProfileDoc = HydratedDocument<WorkerProfileDocument>;

const workerSkillSchema = new Schema<WorkerSkillEntry>(
  {
    skill: { type: Schema.Types.ObjectId, ref: 'Skill', required: true },
    years: { type: Number, required: true, min: 0, max: 60, default: 0 },
    level: {
      type: String,
      enum: Object.values(SkillLevel),
      required: true,
      default: SkillLevel.SKILLED,
    },
  },
  { _id: false },
);

const workerProfileSchema = new Schema<WorkerProfileDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    headline: { type: String, trim: true, maxlength: 120 },
    bio: { type: String, trim: true, maxlength: 1000 },
    skills: { type: [workerSkillSchema], default: [] },
    primaryCategory: { type: Schema.Types.ObjectId, ref: 'Category' },
    experienceYears: { type: Number, required: true, default: 0, min: 0, max: 60 },
    location: { type: geoLocationSchema, required: true },
    workRadiusKm: { type: Number, required: true, default: 15, min: 1, max: 100 },
    expectedWage: { type: wageSchema, required: true },
    availability: {
      type: String,
      enum: Object.values(Availability),
      required: true,
      default: Availability.AVAILABLE_NOW,
    },
    availableFrom: { type: Date, default: null },
    languages: { type: [String], default: [] },
    gender: { type: String, enum: Object.values(Gender) },
    dateOfBirth: { type: Date, default: null },

    ratingAvg: { type: Number, required: true, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, required: true, default: 0 },
    completedJobs: { type: Number, required: true, default: 0 },

    verification: {
      phone: { type: Boolean, required: true, default: false },
      profile: { type: Boolean, required: true, default: false },
      documents: { type: Boolean, required: true, default: false },
    },
    profileCompletion: { type: Number, required: true, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

workerProfileSchema.index({ user: 1 }, { unique: true });
/** The index the whole search depends on — `$geoNear` cannot run without it. */
workerProfileSchema.index({ 'location.geo': '2dsphere' });
workerProfileSchema.index({ 'skills.skill': 1, availability: 1 });
workerProfileSchema.index({ 'location.citySlug': 1, 'location.localitySlug': 1 });
workerProfileSchema.index({ ratingAvg: -1 });
workerProfileSchema.index({ 'expectedWage.amount': 1 });
workerProfileSchema.index({ availability: 1, updatedAt: -1 });
workerProfileSchema.index({ headline: 'text', bio: 'text' });

export const WorkerProfileModel = model<WorkerProfileDocument, Model<WorkerProfileDocument>>(
  'WorkerProfile',
  workerProfileSchema,
);

/**
 * Percentage of the profile that is filled in.
 *
 * Recomputed on every save rather than stored by the client, so the number on a search
 * card and the number on the profile screen can never disagree.
 */
export function computeCompletion(profile: WorkerProfileDocument): number {
  let score = 40; // account, name and a location are required to exist at all
  if (profile.headline) score += 10;
  if (profile.bio) score += 10;
  if (profile.skills.length >= 2) score += 10;
  if (profile.languages.length >= 2) score += 5;
  if (profile.verification.profile) score += 10;
  if (profile.verification.documents) score += 15;
  return Math.min(score, 100);
}
