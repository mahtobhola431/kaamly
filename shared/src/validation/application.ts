import { z } from 'zod';
import { objectIdSchema, paginationSchema, phoneSchema, wageSchema } from './common';

/** Applying. All optional: the worker's profile is the application. */
export const applyToJobSchema = z.object({
  coverNote: z.string().trim().max(1000, 'Keep the note under 1000 characters').optional(),
  expectedWage: wageSchema.optional(),
  phone: phoneSchema.optional(),
});
export type ApplyToJobInput = z.infer<typeof applyToJobSchema>;

const stageEnum = z.enum([
  'APPLIED',
  'REVIEWED',
  'SHORTLISTED',
  'CONTACTED',
  'INTERVIEW',
  'SELECTED',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
]);

/**
 * Stages an employer may set directly. HIRED and REJECTED are absent: one takes a vacancy
 * off the job, the other requires a reason, so both have their own endpoint.
 */
export const applicationStageSchema = z.object({
  stage: z.enum([
    'APPLIED',
    'REVIEWED',
    'SHORTLISTED',
    'CONTACTED',
    'INTERVIEW',
    'SELECTED',
  ]),
  note: z.string().trim().max(500).optional(),
});
export type ApplicationStageInput = z.infer<typeof applicationStageSchema>;

export const rejectApplicationSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'Tell the worker why, even briefly')
    .max(500, 'Keep the reason under 500 characters'),
});
export type RejectApplicationInput = z.infer<typeof rejectApplicationSchema>;

export const hireApplicationSchema = z.object({
  note: z.string().trim().max(500).optional(),
});
export type HireApplicationInput = z.infer<typeof hireApplicationSchema>;

export const withdrawApplicationSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
export type WithdrawApplicationInput = z.infer<typeof withdrawApplicationSchema>;

/** The worker's own list of applications. */
export const myApplicationQuerySchema = paginationSchema.extend({
  stage: stageEnum.optional(),
  /** `active` hides withdrawn and rejected rows without naming every other stage. */
  active: z
    .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
    .transform((value) => value === true || value === 'true' || value === '1')
    .optional(),
});
export type MyApplicationQueryInput = z.infer<typeof myApplicationQuerySchema>;

/** The employer's pipeline board, across every job or narrowed to one. */
export const employerApplicationQuerySchema = paginationSchema.extend({
  stage: stageEnum.optional(),
  job: objectIdSchema.optional(),
  q: z.string().trim().max(80).optional(),
  sort: z.enum(['recent', 'oldest', 'rating']).default('recent'),
});
export type EmployerApplicationQueryInput = z.infer<typeof employerApplicationQuerySchema>;
