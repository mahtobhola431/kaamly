import type { Metadata } from 'next';
import Link from 'next/link';
import { formatWage } from '@rokdajob/shared';
import { Users } from 'lucide-react';
import { AvailabilityBadge, StageBadge } from '@/components/domain/badges';
import { RatingStars } from '@/components/domain/rating-stars';
import { Pagination, ResultCount, SortSelect } from '@/components/domain/result-controls';
import { UserAvatar } from '@/components/domain/user-avatar';
import { WorkerFilters } from '@/components/domain/worker-filters';
import { WorkerGrid } from '@/components/domain/worker-card';
import { EmptyState } from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { demoAgo } from '@/data/time';
import { getCategories, getCities, getSkills } from '@/lib/data/catalog';
import { getEmployerWorkers } from '@/lib/data/employer';
import { parseWorkerParams } from '@/lib/data/params';
import { searchWorkers } from '@/lib/data/workers';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Workers',
  robots: { index: false, follow: false },
};

const SORT_OPTIONS = [
  { value: 'nearest', label: 'Nearest first' },
  { value: 'rating', label: 'Best rated' },
  { value: 'experience', label: 'Most experienced' },
  { value: 'wage_asc', label: 'Lowest wage' },
  { value: 'available', label: 'Available now' },
  { value: 'recent', label: 'Recently active' },
];

export default async function EmployerWorkersPage(props: PageProps<'/e/workers'>) {
  const raw = await props.searchParams;
  const params = parseWorkerParams(raw, 9);

  const [cities, categories, skills, results, myWorkers] = await Promise.all([
    getCities(),
    getCategories(),
    getSkills(),
    searchWorkers(params),
    getEmployerWorkers(),
  ]);

  return (
    <>
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Workers</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Search everyone on the platform, or work from the people you have already hired.
        </p>
      </div>

      <Tabs defaultValue="search" className="mt-5">
        <TabsList>
          <TabsTrigger value="search">Search all ({results.meta.total})</TabsTrigger>
          <TabsTrigger value="mine">My workers ({myWorkers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="pt-4">
          <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
            <WorkerFilters cities={cities} categories={categories} skills={skills} />

            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <ResultCount meta={results.meta} noun="workers" />
                <SortSelect
                  options={SORT_OPTIONS}
                  defaultValue={params.city ? 'nearest' : 'rating'}
                />
              </div>

              {results.items.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No workers match these filters"
                  description="Widen the radius or drop a filter. Availability plus a large radius usually returns the most people."
                  actions={[
                    { label: 'Clear filters', href: routes.e.workers, variant: 'action' },
                    { label: 'Post a job instead', href: routes.e.newJob },
                  ]}
                />
              ) : (
                <>
                  <WorkerGrid
                    workers={results.items}
                    variant="employer"
                    className="xl:grid-cols-2 2xl:grid-cols-3"
                  />
                  <Pagination meta={results.meta} className="mt-8" />
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mine" className="pt-4">
          {myWorkers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Your worker database is empty"
              description="Everyone you shortlist or hire is saved here with their skills, rating and last worked date."
              actions={[{ label: 'Find workers', href: routes.e.workers, variant: 'action' }]}
            />
          ) : (
            <div className="bg-card overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-52">Worker</TableHead>
                    <TableHead>Skill</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="text-right">Wage</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead>Last stage</TableHead>
                    <TableHead>Last worked</TableHead>
                    <TableHead className="w-24">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {myWorkers.map((record) => (
                    <TableRow key={record.worker.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <UserAvatar user={record.worker.user} size="sm" />
                          <div className="min-w-0">
                            <Link
                              href={routes.workerProfile(record.worker.id)}
                              className="font-medium hover:underline"
                            >
                              {record.worker.user.name}
                            </Link>
                            <p className="text-muted-foreground truncate text-xs">
                              {record.jobTitle}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {record.worker.skills[0]?.skill.name ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {record.worker.location.locality ?? record.worker.location.city}
                      </TableCell>
                      <TableCell>
                        <RatingStars
                          rating={record.worker.ratingAvg}
                          size="sm"
                          showValue
                          count={undefined}
                        />
                      </TableCell>
                      <TableCell className="text-right text-sm" data-numeric>
                        {formatWage(
                          record.worker.expectedWage.amount,
                          record.worker.expectedWage.type,
                        )}
                      </TableCell>
                      <TableCell>
                        <AvailabilityBadge availability={record.worker.availability} />
                      </TableCell>
                      <TableCell>
                        <StageBadge stage={record.stage} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {record.lastWorked ? demoAgo(record.lastWorked) : 'Not yet'}
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="outline" size="xs">
                          <Link href={routes.e.messages}>Message</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
