import type { Team, TeamMember } from '@rokdajob/shared';
import { placeOf } from './geo';
import { jobOf } from './jobs';
import { workerOf } from './workers';
import { daysAgo } from './time';

/**
 * Employer teams — the crew an employer keeps together across jobs.
 * A team is a stable roster; a job is a temporary requirement. They are linked, not merged.
 */

interface TeamSeed {
  id: string;
  name: string;
  city: string;
  locality: string;
  activeJob?: string;
  members: { worker: string; role: string; joinedDaysAgo: number; status?: TeamMember['status'] }[];
}

const TEAM_SEEDS: TeamSeed[] = [
  {
    id: 'kalher-site-a',
    name: 'Kalher Site A',
    city: 'bhiwandi',
    locality: 'kalher',
    activeJob: 'construction-helpers-bhiwandi-warehouse-site',
    members: [
      { worker: 'rajesh-kumar', role: 'Lead mason', joinedDaysAgo: 40 },
      { worker: 'balu-kamble', role: 'Bar bender', joinedDaysAgo: 40 },
      { worker: 'sunil-yadav', role: 'Helper', joinedDaysAgo: 12 },
      { worker: 'ramesh-gupta', role: 'Helper', joinedDaysAgo: 12 },
      { worker: 'manoj-mishra', role: 'Helper', joinedDaysAgo: 3 },
      { worker: 'firoz-ansari', role: 'Welder', joinedDaysAgo: 30 },
    ],
  },
  {
    id: 'andheri-tower-mep',
    name: 'Andheri Tower — MEP',
    city: 'mumbai',
    locality: 'andheri-east',
    activeJob: 'electricians-andheri-residential-tower',
    members: [
      { worker: 'imran-shaikh', role: 'Electrician', joinedDaysAgo: 20 },
      { worker: 'mahesh-patil', role: 'Plumber', joinedDaysAgo: 25 },
      { worker: 'santosh-more', role: 'AC technician', joinedDaysAgo: 9 },
      { worker: 'ravi-verma', role: 'Painter', joinedDaysAgo: 60, status: 'INACTIVE' },
    ],
  },
  {
    id: 'finishing-crew',
    name: 'Finishing crew',
    city: 'mumbai',
    locality: 'chembur',
    members: [
      { worker: 'nadeem-khan', role: 'Tile fitter', joinedDaysAgo: 70 },
      { worker: 'ravi-verma', role: 'Painter', joinedDaysAgo: 70 },
      { worker: 'prakash-behera', role: 'Carpenter', joinedDaysAgo: 55 },
    ],
  },
];

export const teams: Team[] = TEAM_SEEDS.map((seed) => {
  const members: TeamMember[] = seed.members.map((member, index) => {
    const worker = workerOf(member.worker);
    const joined = daysAgo(member.joinedDaysAgo);
    return {
      id: `tmb_${seed.id}_${index + 1}`,
      worker: worker.user,
      workerProfile: {
        id: worker.id,
        skills: worker.skills,
        availability: worker.availability,
        ratingAvg: worker.ratingAvg,
      },
      roleLabel: member.role,
      joinedAt: joined,
      status: member.status ?? 'ACTIVE',
      createdAt: joined,
      updatedAt: joined,
    };
  });

  const activeJob = seed.activeJob ? jobOf(seed.activeJob) : undefined;

  return {
    id: `tem_${seed.id}`,
    name: seed.name,
    site: placeOf(seed.city, seed.locality),
    memberCount: members.filter((member) => member.status === 'ACTIVE').length,
    members,
    ...(activeJob
      ? { activeJob: { id: activeJob.id, title: activeJob.title, slug: activeJob.slug } }
      : {}),
    createdAt: daysAgo(90),
    updatedAt: daysAgo(2),
  };
});

export const teamById: Record<string, Team> = Object.fromEntries(
  teams.map((team) => [team.id, team]),
);

export function teamOf(id: string): Team {
  const team = teamById[id];
  if (!team) throw new Error(`Unknown team in demo data: ${id}`);
  return team;
}

/** Role composition for a team, e.g. "2 masons, 3 helpers" on the team card. */
export function roleBreakdown(team: Team): { role: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const member of team.members ?? []) {
    if (member.status !== 'ACTIVE') continue;
    counts.set(member.roleLabel, (counts.get(member.roleLabel) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count);
}
