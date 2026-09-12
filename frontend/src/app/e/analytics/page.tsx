import type { Metadata } from 'next';
import { Percent, Timer, TrendingUp, UserCheck } from 'lucide-react';
import {
  ApplicationsTrendChart,
  FunnelChart,
  SkillDemandChart,
  TimeToHireChart,
} from '@/components/domain/analytics-charts';
import { StatCard } from '@/components/domain/stat-card';
import { getEmployerAnalytics, getEmployerDashboard } from '@/lib/data/employer';

export const metadata: Metadata = {
  title: 'Analytics',
  robots: { index: false, follow: false },
};

export default async function AnalyticsPage() {
  const [analytics, stats] = await Promise.all([getEmployerAnalytics(), getEmployerDashboard()]);

  const totalApplications = analytics.applicationsTrend.reduce(
    (sum, week) => sum + week.applications,
    0,
  );
  const totalHires = analytics.applicationsTrend.reduce((sum, week) => sum + week.hires, 0);
  const latestTimeToHire = analytics.timeToHire[analytics.timeToHire.length - 1]?.days ?? 0;

  return (
    <>
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Analytics</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Hiring performance across all your jobs over the last eight weeks.
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Applications"
          value={totalApplications}
          icon={TrendingUp}
          delta={12}
          hint="Last 8 weeks"
        />
        <StatCard label="Hires" value={totalHires} icon={UserCheck} delta={24} />
        <StatCard
          label="Conversion"
          value={stats.hiringConversionRate}
          suffix="%"
          icon={Percent}
          hint="Applicants who became hires"
        />
        <StatCard
          label="Time to hire"
          value={latestTimeToHire}
          suffix=" days"
          icon={Timer}
          delta={-12}
          hint="Average, this month"
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <ApplicationsTrendChart data={analytics.applicationsTrend} />
        <FunnelChart data={analytics.hiringFunnel} />
        <SkillDemandChart data={analytics.skillDemand} />
        <TimeToHireChart data={analytics.timeToHire} />
      </div>

      <p className="text-muted-foreground mt-6 text-xs">
        Figures come from the demo dataset. Once the API is connected these read from
        <code className="font-mono"> GET /employer/analytics</code>.
      </p>
    </>
  );
}
