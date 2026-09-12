import type { Metadata } from 'next';
import { ConsoleShell } from '@/components/auth/console-shell';
import { ContractorQueue } from '@/components/console/contractor-queue';

export const metadata: Metadata = {
  title: 'Contractor approvals',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Console home.
 *
 * Contractor approval is the only workflow wired to a real endpoint today, so it is the
 * landing screen rather than a dashboard of placeholders. The rest of the console
 * (verification queue, moderation, catalog, analytics) lands with its own phase — see
 * docs/05-ROADMAP.md.
 */
export default function AdminHomePage() {
  return (
    <ConsoleShell>
      <ContractorQueue />
    </ConsoleShell>
  );
}
