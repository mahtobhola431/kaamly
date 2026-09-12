import { z } from 'zod';
import { LIMITS } from '../constants/app';

/** Mongo ObjectId as it appears on the wire. */
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

/** Indian mobile number, stored as 10 digits without the country code. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, ''))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'));

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[a-zA-Z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

export const nameSchema = z.string().trim().min(2, 'Name is too short').max(80, 'Name is too long');

export const pincodeSchema = z.string().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit pincode');

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug');

/** Query params arrive as strings; coerce before validating. */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(LIMITS.pageSizeMax).default(LIMITS.pageSizeDefault),
});
export type PaginationInput = z.infer<typeof paginationSchema>;

export const longitudeSchema = z.coerce.number().min(-180).max(180);
export const latitudeSchema = z.coerce.number().min(-90).max(90);

/**
 * A geo filter can be expressed either as explicit coordinates or as a place slug/pincode,
 * which the backend resolves to coordinates through the `locations` collection.
 */
export const geoQuerySchema = z
  .object({
    lat: latitudeSchema.optional(),
    lng: longitudeSchema.optional(),
    city: slugSchema.optional(),
    locality: slugSchema.optional(),
    pincode: pincodeSchema.optional(),
    radiusKm: z.coerce
      .number()
      .min(1)
      .max(LIMITS.searchRadiusMaxKm)
      .default(LIMITS.searchRadiusDefaultKm),
  })
  .refine((value) => (value.lat === undefined) === (value.lng === undefined), {
    message: 'lat and lng must be provided together',
    path: ['lat'],
  });
export type GeoQueryInput = z.infer<typeof geoQuerySchema>;

export const geoPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([longitudeSchema, latitudeSchema]),
});

export const geoLocationSchema = z.object({
  formatted: z.string().trim().min(3).max(200),
  state: z.string().trim().min(2),
  stateSlug: slugSchema,
  district: z.string().trim().min(2),
  districtSlug: slugSchema,
  city: z.string().trim().min(2),
  citySlug: slugSchema,
  locality: z.string().trim().optional(),
  localitySlug: slugSchema.optional(),
  pincode: pincodeSchema.optional(),
  geo: geoPointSchema,
});
export type GeoLocationInput = z.infer<typeof geoLocationSchema>;

export const wageSchema = z.object({
  amount: z.coerce.number().int().min(50, 'Wage looks too low').max(1_000_000),
  type: z.enum(['PER_DAY', 'PER_HOUR', 'PER_MONTH', 'PER_PIECE']),
  negotiable: z.boolean().default(false),
});
export type WageInput = z.infer<typeof wageSchema>;

/** Accepts `?skill=a&skill=b` and `?skill=a,b` alike. */
export const csvArraySchema = z
  .union([z.string(), z.array(z.string())])
  .transform((value) =>
    (Array.isArray(value) ? value : value.split(',')).map((item) => item.trim()).filter(Boolean),
  );

export const booleanQuerySchema = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((value) => value === true || value === 'true' || value === '1');

/**
 * Public handle. Case-insensitive in practice: stored lowercase so `Ravi` and `ravi`
 * cannot both exist. Must start with a letter so a username is never mistaken for an id.
 */
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(
    /^[a-z][a-z0-9_.]*$/,
    'Username must start with a letter and use only letters, numbers, dots and underscores',
  )
  .refine((value) => !/[._]{2}/.test(value), 'Username cannot contain repeated dots or underscores')
  .refine((value) => !/[._]$/.test(value), 'Username cannot end with a dot or underscore');
