import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Single gate for process.env.
 *
 * Nothing else in the codebase reads `process.env` directly. If a required variable is
 * missing or malformed the process exits at boot with a readable report, rather than
 * failing later inside a request.
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    API_PREFIX: z.string().default('/api/v1'),

    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    MONGODB_DB_NAME: z.string().optional(),

    JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
    JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
    JWT_ACCESS_TTL: z.string().default('15m'),
    JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),

    /** Where the public site lives. Email links and OAuth redirects are built from it. */
    APP_WEB_URL: z.string().url().default('http://localhost:3000'),
    /** Where the admin panel lives; admins land here after a Google sign-in. */
    APP_ADMIN_URL: z.string().url().default('http://localhost:3001'),

    /** Google OAuth. Optional in development: the routes 503 with a clear message when unset. */
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CALLBACK_URL: z
      .string()
      .url()
      .default('http://localhost:5000/api/v1/auth/google/callback'),

    COOKIE_DOMAIN: z.string().optional(),
    COOKIE_SECURE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    /**
     * `lax` is right when the web app and the API share a registrable domain
     * (app.example.com + api.example.com). Split across unrelated domains — a Vercel
     * subdomain calling an AWS one — the browser treats every API call as cross-site and
     * drops a `lax` cookie, which silently breaks the refresh flow. Those deployments need
     * `none`, which browsers only honour together with `Secure`.
     */
    COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),

    /** Comma separated list of allowed browser origins. */
    CORS_ORIGINS: z
      .string()
      .default('http://localhost:3000,http://localhost:3001')
      .transform((value) =>
        value
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean),
      ),

    RATE_LIMIT_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(15 * 60 * 1000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),

    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    CLOUDINARY_FOLDER: z.string().default('rokdajob'),

    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    MAIL_FROM: z.string().default('rokdajob <no-reply@rokdajob.com>'),

    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

    /** Legally sensitive job filters stay off unless explicitly enabled (docs/06-RISKS.md R9). */
    FEATURE_GENDER_AGE_FILTERS: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    FEATURE_SEED_ROUTE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
  })
  .superRefine((value, ctx) => {
    // Browsers reject `SameSite=None` without `Secure`, in every environment.
    if (value.COOKIE_SAMESITE === 'none' && !value.COOKIE_SECURE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['COOKIE_SAMESITE'],
        message: 'COOKIE_SAMESITE=none requires COOKIE_SECURE=true',
      });
    }

    if (value.NODE_ENV !== 'production') return;

    if (!value.COOKIE_SECURE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['COOKIE_SECURE'],
        message: 'COOKIE_SECURE must be true in production',
      });
    }
    if (!value.GOOGLE_CLIENT_ID || !value.GOOGLE_CLIENT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['GOOGLE_CLIENT_ID'],
        message: 'Google OAuth credentials are required in production',
      });
    }
    if (value.FEATURE_SEED_ROUTE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['FEATURE_SEED_ROUTE'],
        message: 'FEATURE_SEED_ROUTE must be false in production',
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const report = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  // Intentionally console, not the logger: the logger depends on this module.
  console.error(`\nInvalid environment configuration:\n${report}\n`);
  console.error('Copy backend/.env.example to backend/.env and fill in the values.\n');
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';

/** Google sign-in is optional in development; the routes 503 with a clear message when unset. */
export const hasGoogleOAuth = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

/** Cloudinary is optional in development; uploads degrade to a clear error when unset. */
export const hasCloudinary = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
);
