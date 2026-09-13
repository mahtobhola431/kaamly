import type { Metadata } from 'next';
import { EmployerDashboard } from '@/components/domain/employer-dashboard';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};

/**
 * The contractor's console home.
 *
 * A thin server shell around a client component: the dashboard reads the signed-in
 * contractor's own jobs, and the access token that authorises those reads lives in the
 * browser.
 */
export default function EmployerDashboardPage() {
  return <EmployerDashboard />;
}
