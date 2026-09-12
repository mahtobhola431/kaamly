import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, Plus, Send } from 'lucide-react';
import { AvailabilityBadge } from '@/components/domain/badges';
import { RatingStars } from '@/components/domain/rating-stars';
import { UserAvatar } from '@/components/domain/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { roleBreakdown } from '@/data/teams';
import { demoDate } from '@/data/time';
import { getTeam, getTeams } from '@/lib/data/employer';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Team',
  robots: { index: false, follow: false },
};

export async function generateStaticParams() {
  const teams = await getTeams();
  return teams.map((team) => ({ id: team.id }));
}

export default async function TeamDetailPage(props: PageProps<'/e/teams/[id]'>) {
  const { id } = await props.params;
  const team = await getTeam(id);
  if (!team) notFound();

  const members = team.members ?? [];
  const roles = roleBreakdown(team);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={routes.e.teams}>
          <ArrowLeft aria-hidden />
          Back to teams
        </Link>
      </Button>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{team.name}</h1>
          <p className="text-muted-foreground mt-1 inline-flex items-center gap-1.5 text-sm">
            {team.site ? (
              <>
                <MapPin className="size-4" aria-hidden />
                {team.site.formatted}
              </>
            ) : (
              'No site assigned'
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <Plus aria-hidden />
            Add member
          </Button>
          <Button variant="action" size="sm">
            <Send aria-hidden />
            Invite team to a job
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {roles.map((role) => (
          <Badge key={role.role} variant="secondary">
            {role.count} {role.role.toLowerCase()}
            {role.count === 1 ? '' : 's'}
          </Badge>
        ))}
        {team.activeJob ? <Badge variant="action">Working on {team.activeJob.title}</Badge> : null}
      </div>

      <div className="bg-card mt-5 overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-52">Member</TableHead>
              <TableHead>Role on this team</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id} className={member.status !== 'ACTIVE' ? 'opacity-60' : ''}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <UserAvatar user={member.worker} size="sm" />
                    <Link
                      href={routes.workerProfile(member.workerProfile?.id ?? '')}
                      className="font-medium hover:underline"
                    >
                      {member.worker.name}
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{member.roleLabel}</TableCell>
                <TableCell>
                  {member.workerProfile ? (
                    <RatingStars rating={member.workerProfile.ratingAvg} size="sm" />
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  {member.workerProfile ? (
                    <AvailabilityBadge availability={member.workerProfile.availability} />
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {demoDate(member.joinedAt)}
                </TableCell>
                <TableCell>
                  <Badge variant={member.status === 'ACTIVE' ? 'success' : 'muted'}>
                    {member.status.charAt(0) + member.status.slice(1).toLowerCase()}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
