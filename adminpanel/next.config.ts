import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // The workspace root, so Turbopack resolves the shared package and the root lockfile.
  turbopack: { root: path.join(__dirname, '..') },

  poweredByHeader: false,

  // `shared` ships TypeScript-compiled CommonJS; Next transpiles it with the app so the
  // workspace package behaves like local source.
  transpilePackages: ['@rokdajob/shared'],

  /**
   * Proxies the browser's API calls to the backend.
   *
   * This exists because the API is served over plain HTTP: an HTTPS page cannot call it
   * directly, the browser blocks it as mixed content. Routing through this origin also
   * makes every request same-site, so the refresh cookie works with `SameSite=Lax`.
   *
   * Only wired up when NEXT_PUBLIC_API_URL is a path — with an absolute URL the browser
   * calls the API directly and no proxy is wanted. The destination is never hardcoded, so
   * the host can change without a code edit.
   */
  async rewrites() {
    const publicBase = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
    const internal = process.env.INTERNAL_API_URL?.replace(/\/$/, '');

    if (!publicBase.startsWith('/') || !internal) return [];

    return [{ source: `${publicBase}/:path*`, destination: `${internal}/:path*` }];
  },

  images: {
    // `domains` is removed in Next 16 — remotePatterns only.
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ],
    formats: ['image/avif', 'image/webp'],
    // Worker phones are small and often on slow networks; these are the sizes we serve.
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    deviceSizes: [320, 420, 640, 768, 1024, 1280, 1536],
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;