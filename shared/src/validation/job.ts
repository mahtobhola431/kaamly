import { z } from 'zod';
import { LIMITS } from '../constants/app';
import { objectIdSchema, paginationSchema, pincodeSchema, slugSchema, wageSchema } from './common';
import { locationInputSchema } from './worker';

/**
 * Job posting input.
 *
 * Location accepts the same three forms a worker profile does — a resolved `GeoLocation`,
 * a pincode, or a city slug — so the posting form can ask for a pincode and let the server
 * place the site on the map.
 */
const jobFields = {
  title: z.string().trim().min(5, 'Give the role a clear title').max(120),
  description: z
    .string()
    .trim()
    .min(30, 'Describe the work in at least a couple of sentences')
    .max(LIMITS.jobDescriptionMaxLength),
  category: objectIdSchema,
  skills: z.array(objectIdSchema).max(15).default([]),
  workersRequired: z.coerce.number().int().min(1).max(LIMITS.maxWorkersPerJob).default(1),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  durationDays: z.coerce.number().int().min(1).max(3650).optional(),
  shift: z.enum(['DAY', 'NIGHT', 'ROTATIONAL', 'FLEXIBLE']).default('DAY'),
  workingHours: z
    .object({
      from: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM'),
      to: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM'),
    })
    .optional(),
  salary: wageSchema,
  perks: z
    .object({
      accommodation: z.boolean().default(false),
      food: z.boolean().default(false),
      transport: z.boolean().default(false),
    })
    .default({ accommodation: false, food: false, transport: false }),
  experienceRequiredYears: z.coerce.number().int().min(0).max(60).default(0),
  urgency: z.enum(['NORMAL', 'URGENT', 'IMMEDIATE']).default('NORMAL'),
  contactPreference: z.enum(['IN_APP', 'PHONE', 'BOTH']).default('IN_APP'),
  /** Posting straight to PUBLISHED is the common case; DRAFT lets one be prepared. */
  status: z.enum(['DRAFT', 'PUBLISHED']).default('PUBLISHED'),
};

export const createJobSchema = z
  .object(jobFields)
  .and(locationInputSchema)
  .refine((value) => !value.endDate || !value.startDate || value.endDate >= value.startDate, {
    message: 'The end date cannot be before the start date',
    path: ['endDate'],
  });
export type CreateJobInput = z.infer<typeof createJobSchema>;

export const updateJobSchema = z
  .object({
    title: jobFields.title.optional(),
    description: jobFields.description.optional(),
    category: objectIdSchema.optional(),
    skills: z.array(objectIdSchema).max(15).optional(),
    workersRequired: z.coerce.number().int().min(1).max(LIMITS.maxWorkersPerJob).optional(),
    startDate: z.coerce.date().nullable().optional(),
    endDate: z.coerce.date().nullable().optional(),
    durationDays: z.coerce.number().int().min(1).max(3650).nullable().optional(),
    shift: jobFields.shift.optional(),
    workingHours: jobFields.workingHours,
    salary: wageSchema.optional(),
    perks: z
      .object({
        accommodation: z.boolean(),
        food: z.boolean(),
        transport: z.boolean(),
      })
      .optional(),
    experienceRequiredYears: z.coerce.number().int().min(0).max(60).optional(),
    urgency: jobFields.urgency.optional(),
    contactPreference: jobFields.contactPreference.optional(),
    location: locationInputSchema.innerType().shape.location,
    pincode: pincodeSchema.optional(),
    citySlug: slugSchema.optional(),
    localitySlug: slugSchema.optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Nothing to update',
  });
export type UpdateJobInput = z.infer<typeof updateJobSchema>;

/** Status changes an employer may make. Terminal states are set by the system. */
export const jobStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'PAUSED', 'HIRING', 'FILLED', 'COMPLETED', 'CANCELLED']),
});
export type JobStatusInput = z.infer<typeof jobStatusSchema>;

/** Public job search. Geography is optional here — a bare list is a valid landing state. */
export const jobSearchSchema = paginationSchema.extend({
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
  shift: z
    .union([z.string(), z.array(z.string())])
    .transform((value) => (Array.isArray(value) ? value : value.split(',')))
    .pipe(z.array(z.enum(['DAY', 'NIGHT', 'ROTATIONAL', 'FLEXIBLE'])))
    .optional(),
  urgency: z
    .union([z.string(), z.array(z.string())])
    .transform((value) => (Array.isArray(value) ? value : value.split(',')))
    .pipe(z.array(z.enum(['NORMAL', 'URGENT', 'IMMEDIATE'])))
    .optional(),
  perk: z
    .union([z.string(), z.array(z.string())])
    .transform((value) => (Array.isArray(value) ? value : value.split(',')))
    .pipe(z.array(z.enum(['accommodation', 'food', 'transport'])))
    .optional(),
  salaryMin: z.coerce.number().int().min(0).optional(),
  maxExperience: z.coerce.number().int().min(0).max(60).optional(),
  sort: z.enum(['recent', 'nearest', 'salary_desc', 'urgent']).default('recent'),
});
export type JobSearchInput = z.infer<typeof jobSearchSchema>;

/** The employer's own list, which unlike the public search includes drafts. */
export const employerJobQuerySchema = paginationSchema.extend({
  status: z
    .enum([
      'DRAFT',
      'PUBLISHED',
      'PAUSED',
      'HIRING',
      'FILLED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
      'EXPIRED',
    ])
    .optional(),
  q: z.string().trim().max(80).optional(),
});
export type EmployerJobQueryInput = z.infer<typeof employerJobQuerySchema>;
