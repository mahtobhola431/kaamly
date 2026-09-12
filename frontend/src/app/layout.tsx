import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { BRAND } from '@rokdajob/shared';
import { siteUrl } from '@/lib/env';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  // Workers open this on low-end phones; only the weights the design system uses.
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description:
    'Find skilled and reliable workers near your worksite, post jobs, manage applicants, and build your workforce from one place.',
  applicationName: BRAND.name,
  keywords: [
    'workers near me',
    'hire labour',
    'construction workers',
    'electrician jobs',
    'daily wage jobs',
    'contractor hiring India',
  ],
  openGraph: {
    type: 'website',
    siteName: BRAND.name,
    locale: 'en_IN',
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.subline,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf9f7' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1020' },
  ],
  width: 'device-width',
  initialScale: 1,
  // Never block zoom — it is an accessibility failure, especially on small screens.
  maximumScale: 5,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en-IN" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col antialiased">
        <a
          href="#main"
          className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
