import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AVAILABILITY_LABEL, formatExperience, formatWage, maskPhone } from '@rokdajob/shared';
import {
  Award,
  Briefcase,
  CircleCheck,
  Languages,
  MapPin,
  MessageSquare,
  Phone,
  Send,
} from 'lucide-react';
import {
  AvailabilityBadge,
  RecentlyActiveBadge,
  TopRatedBadge,
  VerificationBadges,
} from '@/components/domain/badges';
import { RatingStars } from '@/components/domain/rating-stars';
import { UserAvatar } from '@/components/domain/user-avatar';
import { WorkerGrid } from '@/components/domain/worker-card';
import { EmptyState } from '@/components/feedback/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { demoAgo, demoDate } from '@/data/time';
import { getSimilarWorkers, getWorker, getWorkerReviews, searchWorkers } from '@/lib/data/workers';
import { getWorkHistory } from '@/lib/data/worker-area';
import { staticParams } from '@/lib/data/prerender';
import { routes } from '@/lib/routes';

export async function generateStaticParams() {
  return staticParams('worker profiles', async () => {
    const { items } = await searchWorkers({ limit: 50 });
    return items.map((worker) => ({ id: worker.id }));
  });
}

export async function generateMetadata(
  props: PageProps<'/workers/profile/[id]'>,
): Promise<Metadata> {
  const { id } = await props.params;
  const worker = await getWorker(id);
  if (!worker) return { title: 'Worker not found' };

  const trade = worker.skills[0]?.skill.name ?? 'Worker';

  return {
    title: `${worker.user.name} — ${trade} in ${worker.location.city}`,
    description: `${trade} with ${worker.experienceYears} years of experience in ${worker.location.formatted}. Expected ${formatWage(worker.expectedWage.amount, worker.expectedWage.type)}. Rated ${worker.ratingAvg} from ${worker.ratingCount} reviews.`,
    alternates: { canonical: routes.workerProfile(worker.id) },
    // Individual profiles are indexable, but never with contact details in the metadata.
    robots: { index: true, follow: true },
  };
}

export default async function WorkerProfilePage(props: PageProps<'/workers/profile/[id]'>) {
  const { id } = await props.params;
  const worker = await getWorker(id);
  if (!worker) notFound();

  const [reviews, similar, history] = await Promise.all([
    getWorkerReviews(worker.user.id),
    getSimilarWorkers(worker),
    getWorkHistory(),
  ]);

  const primarySkill = worker.skills[0]?.skill.name ?? 'Worker';

  return (
    <>
      <nav aria-label="Breadcrumb" className="border-b">
        <ol className="container-marketing text-muted-foreground flex flex-wrap items-center gap-1.5 py-3 text-sm">
          <li>
            <Link href={routes.workers} className="hover:text-foreground">
              Workers
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link
              href={`${routes.workers}?city=${worker.location.citySlug}`}
              className="hover:text-foreground"
            >
              {worker.location.city}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-foreground font-medium">{worker.user.name}</li>
        </ol>
      </nav>

      <header className="bg-muted/40 border-b">
        <div className="container-marketing py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <UserAvatar user={worker.user} size="xl" className="shrink-0" />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{worker.user.name}</h1>
                <AvailabilityBadge availability={worker.availability} />
                <TopRatedBadge rating={worker.ratingAvg} count={worker.ratingCount} />
              </div>

              <p className="text-muted-foreground mt-1">{worker.headline}</p>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <RatingStars rating={worker.ratingAvg} count={worker.ratingCount} />
                <span className="text-muted-foreground inline-flex items-center gap-1.5">
                  <MapPin className="size-4" aria-hidden />
                  {worker.location.formatted}
                </span>
                <span className="text-muted-foreground inline-flex items-center gap-1.5">
                  <Briefcase className="size-4" aria-hidden />
                  {formatExperience(worker.experienceYears)}
                </span>
                <RecentlyActiveBadge lastActiveAt={worker.user.lastActiveAt} />
              </div>

              <VerificationBadges verification={worker.verification} className="mt-3" />
            </div>

            <div className="bg-card w-full shrink-0 rounded-lg border p-4 sm:w-64">
              <p className="text-muted-foreground text-xs">Expected wage</p>
              <p className="text-xl font-bold" data-numeric>
                {formatWage(worker.expectedWage.amount, worker.expectedWage.type)}
              </p>
              {worker.expectedWage.negotiable ? (
                <p className="text-muted-foreground text-xs">Negotiable</p>
              ) : null}

              <Separator className="my-3" />

              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Travels up to</dt>
                  <dd className="font-medium" data-numeric>
                    {worker.workRadiusKm} km
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Jobs completed</dt>
                  <dd className="font-medium" data-numeric>
                    {worker.completedJobs}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="font-medium" data-numeric>
                    {worker.phone ? maskPhone(worker.phone) : 'Hidden'}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 grid gap-2">
                <Button variant="action" className="w-full">
                  <Send aria-hidden />
                  Invite to a job
                </Button>
                <Button variant="outline" className="w-full">
                  <MessageSquare aria-hidden />
                  Message
                </Button>
              </div>

              <p className="text-muted-foreground mt-3 flex items-start gap-1.5 text-xs leading-relaxed">
                <Phone className="mt-0.5 size-3 shrink-0" aria-hidden />
                The full number is revealed once this worker responds to you.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container-marketing grid gap-8 py-8 lg:grid-cols-[1fr_320px]">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="history">Work history</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="pt-5">
            <h2 className="text-lg font-semibold">About</h2>
            <p className="text-muted-foreground mt-2 leading-relaxed">{worker.bio}</p>

            <h3 className="mt-6 font-semibold">Availability</h3>
            <p className="text-muted-foreground mt-1.5 text-sm">
              {AVAILABILITY_LABEL[worker.availability]}
              {worker.availableFrom ? ` — from ${demoDate(worker.availableFrom)}` : ''}. Willing to
              travel up to {worker.workRadiusKm} km from{' '}
              {worker.location.locality ?? worker.location.city}.
            </p>

            <h3 className="mt-6 font-semibold">Languages</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Languages className="text-muted-foreground size-4" aria-hidden />
              {worker.languages.map((language) => (
                <Badge key={language} variant="secondary">
                  {language}
                </Badge>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="skills" className="pt-5">
            <h2 className="text-lg font-semibold">Skills and trades</h2>
            <ul className="mt-4 space-y-3">
              {worker.skills.map((entry) => (
                <li
                  key={entry.skill.id}
                  className="bg-card flex items-center justify-between gap-4 rounded-lg border p-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{entry.skill.name}</p>
                    <p className="text-muted-foreground text-sm">{entry.skill.category.name}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant={entry.level === 'EXPERT' ? 'success' : 'secondary'}>
                      {entry.level.charAt(0) + entry.level.slice(1).toLowerCase()}
                    </Badge>
                    <span className="text-muted-foreground text-sm" data-numeric>
                      {entry.years} yr{entry.years === 1 ? '' : 's'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="history" className="pt-5">
            <h2 className="text-lg font-semibold">Work history</h2>
            <ol className="mt-4 space-y-4">
              {history.map((entry) => (
                <li key={entry.id} className="bg-card rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{entry.role}</p>
                      <p className="text-muted-foreground text-sm">{entry.company}</p>
                    </div>
                    {entry.verified ? (
                      <span className="text-success inline-flex items-center gap-1 text-xs font-medium">
                        <CircleCheck className="size-3.5" aria-hidden />
                        Verified on rokdajob
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Self reported</span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm" data-numeric>
                    {demoDate(entry.from)} – {demoDate(entry.to)} · {entry.daysWorked} days ·{' '}
                    {entry.location}
                  </p>
                </li>
              ))}
            </ol>
          </TabsContent>

          <TabsContent value="reviews" className="pt-5">
            <h2 className="text-lg font-semibold">Reviews from employers</h2>
            {reviews.length === 0 ? (
              <EmptyState
                icon={Award}
                title="No reviews yet"
                description="Reviews appear here after this worker completes a job through rokdajob."
                className="mt-4"
              />
            ) : (
              <ul className="mt-4 space-y-4">
                {reviews.map((review) => (
                  <li key={review.id} className="bg-card rounded-lg border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <UserAvatar user={review.author} size="sm" />
                        <div>
                          <p className="text-sm font-medium">{review.author.name}</p>
                          <p className="text-muted-foreground text-xs">{review.job.title}</p>
                        </div>
                      </div>
                      <RatingStars rating={review.rating} size="sm" showValue={false} />
                    </div>
                    <p className="mt-3 text-sm leading-relaxed">{review.comment}</p>
                    <dl className="text-muted-foreground mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                      {Object.entries(review.categories).map(([key, value]) => (
                        <div key={key} className="flex gap-1">
                          <dt className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</dt>
                          <dd className="font-medium" data-numeric>
                            {value}/5
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="text-muted-foreground mt-2 text-xs">
                      {demoAgo(review.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>

        <aside>
          <div className="bg-card rounded-lg border p-5">
            <h2 className="font-semibold">Hiring this trade?</h2>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Post a job and workers like {worker.user.name.split(' ')[0]} will see it in their
              nearby feed.
            </p>
          </div>

          <div className="bg-card mt-4 rounded-lg border p-5">
            <h2 className="font-semibold">Staying safe</h2>
            <ul className="text-muted-foreground mt-2 space-y-2 text-sm">
              <li>Agree the rate and duration in writing before work starts.</li>
              <li>Never pay a fee to hire or to get hired.</li>
              <li>Report anything suspicious from the profile menu.</li>
            </ul>
            <Button asChild variant="ghost" size="sm" className="mt-3 px-0">
              <Link href={routes.trustSafety}>Read the safety guide</Link>
            </Button>
          </div>
        </aside>
      </div>

      {similar.length > 0 ? (
        <section className="bg-muted/40 border-t py-12" aria-labelledby="similar-workers">
          <div className="container-marketing">
            <h2 id="similar-workers" className="text-xl font-bold">
              Similar {primarySkill.toLowerCase()}s nearby
            </h2>
            <WorkerGrid workers={similar} className="mt-5" />
          </div>
        </section>
      ) : null}
    </>
  );
}
