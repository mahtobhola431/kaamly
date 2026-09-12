import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { routes } from '@/lib/routes';

/** Shared chrome for the legal pages: narrow measure, cross-links, and an honesty notice. */
export default function LegalLayout({ children }: LayoutProps<'/legal'>) {
  return (
    <div className="container-marketing grid gap-10 py-12 lg:grid-cols-[220px_1fr]">
      <nav aria-label="Legal" className="lg:sticky lg:top-20 lg:h-fit">
        <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">
          Legal
        </p>
        <ul className="space-y-1 text-sm">
          <li>
            <Link href={routes.terms} className="hover:text-primary block rounded-md py-1">
              Terms of use
            </Link>
          </li>
          <li>
            <Link href={routes.privacy} className="hover:text-primary block rounded-md py-1">
              Privacy policy
            </Link>
          </li>
          <li>
            <Link href={routes.trustSafety} className="hover:text-primary block rounded-md py-1">
              Trust and safety
            </Link>
          </li>
        </ul>
      </nav>

      <div className="max-w-2xl">
        <div className="border-action/30 bg-action-subtle mb-8 flex gap-3 rounded-lg border p-4">
          <AlertTriangle className="text-action-hover mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="text-sm leading-relaxed">
            <span className="font-semibold">Draft, not legal advice.</span> These documents are a
            plain-language starting point written alongside the product. They must be reviewed by a
            lawyer before rokdajob accepts real users.
          </p>
        </div>

        <article className="prose-rokda">{children}</article>
      </div>
    </div>
  );
}
