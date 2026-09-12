import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/env';

/**
 * The worker app, employer CRM and auth screens are private surfaces — they carry no SEO
 * value and would expose signed-in shapes to crawlers, so they are disallowed here as well
 * as being marked noindex in their own metadata.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/w/', '/e/', '/auth/', '/status'],
      },
    ],
    sitemap: siteUrl('/sitemap.xml'),
    host: siteUrl(),
  };
}
