import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, MapPin, Plus } from 'lucide-react';
import { UserAvatar } from '@/components/domain/user-avatar';
import { EmptyState } from '@/components/feedback/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { roleBreakdown } from '@/data/teams';
import { getTeams } from '@/lib/data/employer';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Teams',
  robots: { index: false, follow: false },
};

export default async function TeamsPage() {
  const teams = await getTeams();

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Teams</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            A team is the crew you keep together across jobs — the people you would call first for
            the next site.
          </p>
        </div>
        <Button variant="action" size="sm">
          <Plus aria-hidden />
          New team
        </Button>
      </div>

      <div className="mt-5">
        {teams.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No teams yet"
            description="Group workers you have hired into a team so you can invite the whole crew to your next job in one action."
            actions={[{ label: 'Find workers', href: routes.e.workers, variant: 'action' }]}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {teams.map((team) => {
              const roles = roleBreakdown(team);
              const members = (team.members ?? []).filter((member) => member.status === 'ACTIVE');

              return (
                <article key={team.id} className="bg-card rounded-lg border p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-semibold">
                        <Link href={routes.e.team(team.id)} className="hover:text-primary">
                          {team.name}
                        </Link>
                      </h2>
                      {team.site ? (
                        <p className="text-muted-foreground mt-0.5 inline-flex items-center gap-1 text-sm">
                          <MapPin className="size-3.5" aria-hidden />
                          {team.site.locality ?? team.site.city}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant="muted" data-numeric>
                      {team.memberCount}
                    </Badge>
                  </div>

                  {team.activeJob ? (
                    <p className="text-muted-foreground mt-3 text-sm">
                      Working on{' '}
                      <Link
                        href={routes.e.job(team.activeJob.slug)}
                        className="text-foreground font-medium hover:underline"
                      >
                        {team.activeJob.title}
                      </Link>
                    </p>
                  ) : (
                    <p className="text-muted-foreground mt-3 text-sm">Not assigned to a job</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {roles.map((role) => (
                      <Badge key={role.role} variant="secondary">
                        {role.count} {role.role.toLowerCase()}
                        {role.count === 1 ? '' : 's'}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {members.slice(0, 5).map((member) => (
                        <UserAvatar
                          key={member.id}
                          user={member.worker}
                          size="sm"
                          className="ring-card ring-2"
                        />
                      ))}
                    </div>
                    {members.length > 5 ? (
                      <span className="text-muted-foreground text-xs" data-numeric>
                        +{members.length - 5}
                      </span>
                    ) : null}

                    <Button asChild variant="outline" size="sm" className="ml-auto">
                      <Link href={routes.e.team(team.id)}>Manage</Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
