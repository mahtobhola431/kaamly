import { z } from 'zod';
import { LIMITS } from '../constants/app';
import {
  geoLocationSchema,
  objectIdSchema,
  paginationSchema,
  pincodeSchema,
  slugSchema,
  wageSchema,
} from './common';

/**
 * Worker profile input.
 *
 * Location can arrive two ways: as a full `GeoLocation` the client already resolved, or as
 * a pincode / city+locality the server resolves against the `locations` collection. The
 * second form is what onboarding uses, so a worker types six digits instead of picking
 * from four dropdowns.
 */
export const locationInputSchema = z
  .object({
    location: geoLocationSchema.optional(),
    pincode: pincodeSchema.optional(),
    citySlug: slugSchema.optional(),
    localitySlug: slugSchema.optional(),
  })
  .refine((value) => Boolean(value.location ?? value.pincode ?? value.citySlug), {
    message: 'Provide a location, a pincode, or a city',
  });
export type LocationInput = z.infer<typeof locationInputSchema>;

export const workerSkillSchema = z.object({
  skill: objectIdSchema,
  years: z.coerce.number().int().min(0).max(60).default(0),
  level: z.enum(['BEGINNER', 'SKILLED', 'EXPERT']).default('SKILLED'),
});
export type WorkerSkillInput = z.infer<typeof workerSkillSchema>;

const profileFields = {
  headline: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(LIMITS.bioMaxLength).optional(),
  skills: z.array(workerSkillSchema).max(LIMITS.maxSkillsPerWorker).default([]),
  primaryCategory: objectIdSchema.optional(),
  experienceYears: z.coerce.number().int().min(0).max(60).default(0),
  workRadiusKm: z.coerce.number().int().min(1).max(LIMITS.workRadiusMaxKm).default(15),
  expectedWage: wageSchema,
  availability: z
    .enum(['AVAILABLE_NOW', 'AVAILABLE_FROM', 'BUSY', 'NOT_LOOKING'])
    .default('AVAILABLE_NOW'),
  availableFrom: z.coerce.date().optional(),
  languages: z.array(z.string().trim().min(2).max(40)).max(10).default([]),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.coerce.date().optional(),
};

export const createWorkerProfileSchema = z
  .object(profileFields)
  .and(locationInputSchema)
  .refine(
    (value) => value.availability !== 'AVAILABLE_FROM' || Boolean(value.availableFrom),
    { message: 'Tell employers the date you become available', path: ['availableFrom'] },
  );
export type CreateWorkerProfileInput = z.infer<typeof createWorkerProfileSchema>;

/** Every field optional; only what is sent is changed. */
export const updateWorkerProfileSchema = z
  .object({
    headline: profileFields.headline,
    bio: profileFields.bio,
    skills: z.array(workerSkillSchema).max(LIMITS.maxSkillsPerWorker).optional(),
    primaryCategory: profileFields.primaryCategory,
    experienceYears: z.coerce.number().int().min(0).max(60).optional(),
    workRadiusKm: z.coerce.number().int().min(1).max(LIMITS.workRadiusMaxKm).optional(),
    expectedWage: wageSchema.optional(),
    availability: profileFields.availability.optional(),
    availableFrom: z.coerce.date().nullable().optional(),
    languages: z.array(z.string().trim().min(2).max(40)).max(10).optional(),
    gender: profileFields.gender,
    dateOfBirth: z.coerce.date().nullable().optional(),
    location: geoLocationSchema.optional(),
    pincode: pincodeSchema.optional(),
    citySlug: slugSchema.optional(),
    localitySlug: slugSchema.optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Nothing to update',
  });
export type UpdateWorkerProfileInput = z.infer<typeof updateWorkerProfileSchema>;

export const availabilityUpdateSchema = z
  .object({
    availability: z.enum(['AVAILABLE_NOW', 'AVAILABLE_FROM', 'BUSY', 'NOT_LOOKING']),
    availableFrom: z.coerce.date().optional(),
  })
  .refine((value) => value.availability !== 'AVAILABLE_FROM' || Boolean(value.availableFrom), {
    message: 'Tell employers the date you become available',
    path: ['availableFrom'],
  });
export type AvailabilityUpdateInput = z.infer<typeof availabilityUpdateSchema>;

/** Public worker search. Geography is required in one of its three forms. */
export const workerSearchSchema = paginationSchema.extend({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  city: slugSchema.optional(),
  locality: slugSchema.optional(),
  pincode: pincodeSchema.optional(),
  radiusKm: z.coerce
    .number()
    .min(1)
    .max(LIMITS.searchRadiusMaxKm)
    .default(LIMITS.searchRadiusDefaultKm),
  skill: z
    .union([z.string(), z.array(z.string())])
    .transform((value) => (Array.isArray(value) ? value : value.split(',')))
    .pipe(z.array(slugSchema))
    .optional(),
  category: slugSchema.optional(),
  q: z.string().trim().max(80).optional(),
  minExperience: z.coerce.number().int().min(0).max(60).optional(),
  maxWage: z.coerce.number().int().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  availability: z.enum(['AVAILABLE_NOW', 'AVAILABLE_FROM', 'BUSY', 'NOT_LOOKING']).optional(),
  verified: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  language: z
    .union([z.string(), z.array(z.string())])
    .transform((value) => (Array.isArray(value) ? value : value.split(',')))
    .optional(),
  sort: z
    .enum(['nearest', 'rating', 'experience', 'wage_asc', 'available', 'recent'])
    .default('nearest'),
});
export type WorkerSearchInput = z.infer<typeof workerSearchSchema>;
