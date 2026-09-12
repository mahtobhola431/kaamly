'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ALLOWED_STAGE_TRANSITIONS,
  APPLICATION_STAGE_LABEL,
  PIPELINE_STAGES,
  formatDistance,
  formatWage,
} from '@rokdajob/shared';
import type { Application, ApplicationStage } from '@rokdajob/shared';
import { GripVertical, MapPin, MoreHorizontal, Star } from 'lucide-react';
import { toast } from 'sonner';
import { STAGE_ACCENT } from '@/components/domain/badges';
import { UserAvatar } from '@/components/domain/user-avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

/**
 * Employer pipeline board.
 *
 * Drag and drop is the fast path, but every move is also available from a keyboard-reachable
 * menu on each card — a board that can only be operated by mouse is not shippable.
 *
 * Transitions are validated against `ALLOWED_STAGE_TRANSITIONS` from the shared package,
 * the same table the API will enforce, so the UI cannot suggest an impossible move.
 */
export function ApplicationPipeline({ applications }: { applications: Application[] }) {
  const [board, setBoard] = useState(applications);
  const [dragging, setDragging] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<ApplicationStage | null>(null);

  function move(id: string, to: ApplicationStage): void {
    const application = board.find((item) => item.id === id);
    if (!application || application.stage === to) return;

    const allowed = ALLOWED_STAGE_TRANSITIONS[application.stage];
    if (!allowed.includes(to)) {
      toast.error(
        `Cannot move from ${APPLICATION_STAGE_LABEL[application.stage]} to ${APPLICATION_STAGE_LABEL[to]}`,
      );
      return;
    }

    setBoard((previous) =>
      previous.map((item) => (item.id === id ? { ...item, stage: to } : item)),
    );

    toast.success(`${application.worker.name} moved to ${APPLICATION_STAGE_LABEL[to]}`, {
      description: 'Not saved — the applications API is not connected yet.',
    });
  }

  const columns = PIPELINE_STAGES.map((stage) => ({
    stage,
    items: board.filter((application) => application.stage === stage),
  }));

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max gap-3">
        {columns.map(({ stage, items }) => (
          <section
            key={stage}
            aria-label={`${APPLICATION_STAGE_LABEL[stage]}, ${items.length} applicants`}
            onDragOver={(event) => {
              event.preventDefault();
              setOverStage(stage);
            }}
            onDragLeave={() => setOverStage((current) => (current === stage ? null : current))}
            onDrop={(event) => {
              event.preventDefault();
              setOverStage(null);
              if (dragging) move(dragging, stage);
              setDragging(null);
            }}
            className={cn(
              'bg-muted/40 w-72 shrink-0 rounded-lg border p-2 transition-colors',
              overStage === stage && 'border-action bg-action-subtle/40',
            )}
          >
            <header className="flex items-center gap-2 px-2 py-2">
              <span aria-hidden className={cn('size-2 rounded-full', STAGE_ACCENT[stage])} />
              <h3 className="text-sm font-semibold">{APPLICATION_STAGE_LABEL[stage]}</h3>
              <span className="text-muted-foreground ml-auto text-xs" data-numeric>
                {items.length}
              </span>
            </header>

            <ul className="space-y-2">
              {items.map((application) => {
                const allowed = ALLOWED_STAGE_TRANSITIONS[application.stage];
                const profile = application.workerProfile;

                return (
                  <li
                    key={application.id}
                    draggable
                    onDragStart={() => setDragging(application.id)}
                    onDragEnd={() => setDragging(null)}
                    className={cn(
                      'bg-card cursor-grab rounded-md border p-3 shadow-[var(--shadow-card)] transition-opacity active:cursor-grabbing',
                      dragging === application.id && 'opacity-50',
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical
                        className="text-muted-foreground mt-0.5 size-3.5 shrink-0"
                        aria-hidden
                      />
                      <UserAvatar user={application.worker} size="sm" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{application.worker.name}</p>
                        <p className="text-muted-foreground truncate text-xs">
                          {profile?.skills[0]?.skill.name ?? 'Worker'}
                        </p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Move ${application.worker.name} to another stage`}
                          >
                            <MoreHorizontal aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Move to</DropdownMenuLabel>
                          {allowed.length === 0 ? (
                            <DropdownMenuItem disabled>No moves available</DropdownMenuItem>
                          ) : (
                            allowed.map((target) => (
                              <DropdownMenuItem
                                key={target}
                                onSelect={() => move(application.id, target)}
                              >
                                {APPLICATION_STAGE_LABEL[target]}
                              </DropdownMenuItem>
                            ))
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={routes.workerProfile(profile?.id ?? '')}>
                              View full profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={routes.e.messages}>Message</Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="text-muted-foreground mt-2 truncate text-xs">
                      {application.job.title}
                    </p>

                    <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      {profile ? (
                        <>
                          <span className="inline-flex items-center gap-1">
                            <Star className="text-action size-3" aria-hidden />
                            <span data-numeric>{profile.ratingAvg.toFixed(1)}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 truncate">
                            <MapPin className="size-3" aria-hidden />
                            {profile.distanceKm !== undefined
                              ? formatDistance(profile.distanceKm)
                              : (profile.location.locality ?? profile.location.city)}
                          </span>
                        </>
                      ) : null}
                      {application.expectedWage ? (
                        <span data-numeric>
                          {formatWage(
                            application.expectedWage.amount,
                            application.expectedWage.type,
                          )}
                        </span>
                      ) : null}
                    </div>

                    {application.source === 'INVITED' ? (
                      <p className="text-action-hover mt-2 text-xs font-medium">Invited</p>
                    ) : null}
                  </li>
                );
              })}

              {items.length === 0 ? (
                <li className="text-muted-foreground rounded-md border border-dashed px-3 py-6 text-center text-xs">
                  Drop a card here
                </li>
              ) : null}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
