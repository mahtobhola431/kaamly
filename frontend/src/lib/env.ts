import { z } from 'zod';

/**
 * Client-visible configuration.
 *
 * `NEXT_PUBLIC_*` values are inlined at build time, so the whole object must be
 * referenced statically — destructuring `process.env` at runtime would not work.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL must be a full URL'),
  NEXT_PUBLIC_SITE_URL: z.string().url('NEXT_PUBLIC_SITE_URL must be a full URL'),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
});

const parsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
});

if (!parsed.success) {
  const report = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(
    `Invalid frontend environment configuration:\n${report}\n\nCopy frontend/.env.example to frontend/.env.local.`,
  );
}

export const clientEnv = parsed.data;

/** Absolute URL for an API path: `apiUrl('/health')` -> `http://localhost:5000/api/v1/health`. */
export function apiUrl(path: string): string {
  const base = clientEnv.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Absolute URL on the marketing site, used for canonical tags and Open Graph. */
export function siteUrl(path = '/'): string {
  const base = clientEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
