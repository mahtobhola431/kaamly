'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/**
 * Charts use the design-system chart tokens, never ad-hoc colours, so light and dark
 * themes stay consistent. Navy carries the primary series, amber the secondary.
 */

const AXIS = {
  stroke: 'var(--muted-foreground)',
  fontSize: 12,
  tickLine: false,
  axisLine: false,
} as const;

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card rounded-lg border p-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>
      <div className="mt-4 h-64">{children}</div>
    </section>
  );
}

const tooltipStyle = {
  backgroundColor: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontSize: 12,
  color: 'var(--popover-foreground)',
} as const;

export function ApplicationsTrendChart({
  data,
}: {
  data: { week: string; applications: number; hires: number }[];
}) {
  return (
    <ChartCard title="Applications and hires" description="Last eight weeks across all your jobs.">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="week" {...AXIS} />
          <YAxis {...AXIS} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'var(--border)' }} />
          <Line
            type="monotone"
            dataKey="applications"
            name="Applications"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="hires"
            name="Hires"
            stroke="var(--chart-2)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function FunnelChart({ data }: { data: { stage: string; count: number }[] }) {
  const top = data[0]?.count ?? 1;

  return (
    <ChartCard
      title="Hiring funnel"
      description="How many applicants reach each stage. The biggest drop tells you where to focus."
    >
      <ul className="space-y-2.5">
        {data.map((row) => {
          const percent = Math.round((row.count / top) * 100);
          return (
            <li key={row.stage}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>{row.stage}</span>
                <span className="text-muted-foreground" data-numeric>
                  {row.count} · {percent}%
                </span>
              </div>
              <div className="bg-muted h-2.5 overflow-hidden rounded-full">
                <div
                  className="bg-chart-1 h-full rounded-full"
                  style={{ width: `${percent}%` }}
                  role="presentation"
                />
              </div>
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
}

export function SkillDemandChart({ data }: { data: { skill: string; count: number }[] }) {
  return (
    <ChartCard
      title="Which trades you hire most"
      description="Positions posted by skill in the last 90 days."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 24 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" {...AXIS} />
          <YAxis type="category" dataKey="skill" width={90} {...AXIS} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--muted)' }} />
          <Bar dataKey="count" name="Positions" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={entry.skill} fill={index === 0 ? 'var(--chart-2)' : 'var(--chart-1)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function TimeToHireChart({ data }: { data: { month: string; days: number }[] }) {
  return (
    <ChartCard
      title="Time to hire"
      description="Average days from a job going live to the first hire."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" {...AXIS} />
          <YAxis {...AXIS} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--muted)' }} />
          <Bar dataKey="days" name="Days" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
