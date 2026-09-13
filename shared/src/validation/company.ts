import { z } from 'zod';
import { pincodeSchema, slugSchema } from './common';
import { locationInputSchema } from './worker';

/**
 * All fields optional — the company already exists, created from the name given at
 * registration. `verification` and `ratingAvg` are absent: an admin grants one, completed
 * work earns the other.
 */
export const updateCompanySchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your company name').max(120).optional(),
    type: z
      .enum([
        'CONTRACTOR',
        'CONSTRUCTION',
        'WAREHOUSE',
        'FACTORY',
        'MAINTENANCE',
        'SMALL_BUSINESS',
        'PROPERTY',
        'SERVICE_PROVIDER',
        'OTHER',
      ])
      .optional(),
    about: z
      .string()
      .trim()
      .max(2000, 'Keep it under 2000 characters')
      .optional()
      .or(z.literal('')),
    size: z.string().trim().max(40).optional().or(z.literal('')),
    foundedYear: z.coerce
      .number()
      .int()
      .min(1800, 'That looks too early')
      .max(new Date().getFullYear(), 'That year is in the future')
      .optional()
      .nullable(),
    /** GSTIN: 2 state digits, a 10-char PAN, entity digit, fixed `Z`, checksum. */
    gstin: z
      .string()
      .trim()
      .toUpperCase()
      .regex(
        /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z][0-9A-Z]$/,
        'Enter a valid 15-character GSTIN',
      )
      .optional()
      .or(z.literal('')),
    location: locationInputSchema.innerType().shape.location,
    pincode: pincodeSchema.optional(),
    citySlug: slugSchema.optional(),
    localitySlug: slugSchema.optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Nothing to update',
  });
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
