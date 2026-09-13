import type { Metadata } from 'next';
import { CompanyProfile } from '@/components/domain/company-profile';

export const metadata: Metadata = {
  title: 'Company profile',
  robots: { index: false, follow: false },
};

/**
 * The contractor's own company record, read from and written to `/employer/company`.
 *
 * A client component: the access token lives in the browser, so a server render has no
 * way to prove whose company to load.
 */
export default function CompanyPage() {
  return (
    <div className="max-w-3xl">
      <CompanyProfile />
    </div>
  );
}
