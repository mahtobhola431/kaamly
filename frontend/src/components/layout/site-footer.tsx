import Link from 'next/link';
import { BRAND } from '@rokdajob/shared';
import { LogoMark } from '@/components/layout/logo';

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'For employers',
    links: [
      { href: '/workers', label: 'Search workers' },
      { href: '/e/jobs/new', label: 'Post a job' },
      { href: '/e', label: 'Employer dashboard' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/for-employers', label: 'How hiring works' },
    ],
  },
  {
    title: 'For workers',
    links: [
      { href: '/jobs', label: 'Search jobs' },
      { href: '/w', label: 'Worker app' },
      { href: '/auth/register?role=worker', label: 'Create a profile' },
      { href: '/for-workers', label: 'How it works' },
      { href: '/trust-safety', label: 'Staying safe' },
    ],
  },
  {
    title: 'Browse',
    links: [
      { href: '/workers/mumbai/electricians', label: 'Electricians in Mumbai' },
      { href: '/workers/mumbai/masons', label: 'Masons in Mumbai' },
      { href: '/jobs/bhiwandi/warehouse', label: 'Warehouse jobs in Bhiwandi' },
      { href: '/jobs/thane', label: 'Jobs in Thane' },
      { href: '/categories', label: 'All categories' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
      { href: '/trust-safety', label: 'Trust and safety' },
      { href: '/legal/terms', label: 'Terms' },
      { href: '/legal/privacy', label: 'Privacy' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground mt-auto">
      <div className="container-marketing py-12">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_3fr]">
          <div>
            <div className="flex items-center gap-2">
          
              <span className="text-lg font-bold">Kaamly</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-white/70">{BRAND.tagline}</p>
            <p className="mt-4 max-w-sm text-sm text-white/60">{BRAND.subline}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  {column.title}
                </h2>
                <ul className="mt-3 space-y-2">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="rounded-sm text-sm text-white/80 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()}Kaamly. Built for local hiring in India.
          </p>
          <p>
            Wages are settled directly between employers and workers. {BRAND.name} does not handle
            payments.
          </p>
        </div>
      </div>
    </footer>
  );
}
