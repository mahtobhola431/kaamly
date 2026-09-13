import { z } from 'zod';

/**
 * Client-visible configuration.
 *
 * `NEXT_PUBLIC_*` values are inlined at build time, so the whole object must be
 * referenced statically — destructuring `process.env` at runtime would not work.
 */

/**
 * `URL.canParse` would be neater but it needs Chrome 120 / Safari 17, and this module is
 * evaluated on page load. On an older phone it is `undefined` and the app dies before it
 * paints.
 */
function isAbsoluteUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

const clientEnvSchema = z.object({
  /**
   * Either a full URL, or a path like `/api/v1` when the API is reached through the
   * rewrite in `next.config.ts`. Deliberately not branched on `NEXT_PUBLIC_APP_ENV`:
   * that value is inlined at compile time from whichever `.env` file is present, so a
   * rule keyed on it passes locally and fails on the deploy, or the reverse.
   */
  NEXT_PUBLIC_API_URL: z
    .string()
    .min(1, 'NEXT_PUBLIC_API_URL is required')
    .refine(
      (value) => value.startsWith('/') || isAbsoluteUrl(value),
      'NEXT_PUBLIC_API_URL must be a full URL or a path such as /api/v1',
    ),
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
    `Invalid admin panel environment configuration:\n${report}\n\nCopy adminpanel/.env.example to adminpanel/.env.local.`,
  );
}

export const clientEnv = parsed.data;

/**
 * The API base this runtime should call.
 *
 * A relative base only means something in a browser, where it keeps the request on this
 * origin so the rewrite in `next.config.ts` can forward it — which is how an HTTPS page
 * reaches a plain-HTTP backend without the browser blocking it as mixed content.
 *
 * On the server there is no origin to be relative to (`fetch('/api/v1/jobs')` throws) and
 * no rewrite either, since rewrites only apply to requests that arrive over the network.
 * Server rendering, `generateStaticParams` and the sitemap therefore go straight to
 * `INTERNAL_API_URL`, skipping the proxy hop entirely.
 */
export function apiBaseUrl(): string {
  const base = clientEnv.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  if (!base.startsWith('/')) return base;
  if (typeof window !== 'undefined') return base;

  const internal = process.env.INTERNAL_API_URL?.replace(/\/$/, '');
  if (!internal) {
    throw new Error(
      `NEXT_PUBLIC_API_URL is "${base}", a path the server cannot fetch.\n` +
        'Set INTERNAL_API_URL to the API\'s absolute base URL, for example\n' +
        '  INTERNAL_API_URL=http://ec2-1-2-3-4.compute-1.amazonaws.com/api/v1',
    );
  }
  return internal;
}

/** An API URL for the current runtime: `apiUrl('/health')` -> `<base>/health`. */
export function apiUrl(path: string): string {
  const base = apiBaseUrl();
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Absolute URL on the admin panel. */
export function siteUrl(path = '/'): string {
  const base = clientEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
