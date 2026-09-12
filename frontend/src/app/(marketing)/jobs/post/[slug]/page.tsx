import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  SALARY_TYPE_LABEL,
  SHIFT_LABEL,
  formatRupees,
  formatWage,
  pluralize,
} from '@rokdajob/shared';
import type { Job } from '@rokdajob/shared';
import {
  Bed,
  Bookmark,
  Building2,
  CalendarDays,
  Clock,
  MapPin,
  Share2,
  ShieldCheck,
  Truck,
  UsersRound,
  Utensils,
} from 'lucide-react';
import { CompanyVerifiedBadge, JobStatusBadge, UrgencyBadge } from '@/components/domain/badges';
import { JobCard } from '@/components/domain/job-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { demoAgo, demoDate, demoDay } from '@/data/time';
import { getJob, getSimilarJobs, searchJobs } from '@/lib/data/jobs';
import { routes } from '@/lib/routes';
import { siteUrl } from '@/lib/env';

export async function generateStaticParams() {
  const { items } = await searchJobs({ limit: 50 });
  return items.map((job) => ({ slug: job.slug }));
}

export async function generateMetadata(props: PageProps<'/jobs/post/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const job = await getJob(slug);
  if (!job) return { title: 'Job not found' };

  const description = `${job.company.name} is hiring ${pluralize(job.workersRequired, 'worker')} in ${job.location.formatted}. ${formatWage(job.salary.amount, job.salary.type)}. ${job.description.slice(0, 110)}…`;

  return {
    title: job.title,
    description,
    alternates: { canonical: routes.job(job.slug) },
    openGraph: { title: job.title, description, type: 'article' },
  };
}

/** Google Jobs structured data. Only emitted for jobs that are actually open. */
function JobPostingJsonLd({ job }: { job: Job }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.publishedAt,
    validThrough: job.expiresAt,
    employmentType: job.durationDays && job.durationDays > 180 ? 'FULL_TIME' : 'TEMPORARY',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company.name,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location.locality ?? job.location.city,
        addressRegion: job.location.state,
        postalCode: job.location.pincode,
        addressCountry: 'IN',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: job.location.geo.coordinates[1],
        longitude: job.location.geo.coordinates[0],
      },
    },
    baseSalary: {
      '@type': 'MonetaryAmount',
      currency: 'INR',
      value: {
        '@type': 'QuantitativeValue',
        value: job.salary.amount,
        unitText:
          job.salary.type === 'PER_DAY' ? 'DAY' : job.salary.type === 'PER_HOUR' ? 'HOUR' : 'MONTH',
      },
    },
    totalJobOpenings: job.workersRequired,
    url: siteUrl(routes.job(job.slug)),
  };

  return (
    <script
      type="application/ld+json"
      // Serialised server-side from our own data; no user input reaches this.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

export default async function JobDetailPage(props: PageProps<'/jobs/post/[slug]'>) {
  const { slug } = await props.params;
  const job = await getJob(slug);
  if (!job) notFound();

  const similar = await getSimilarJobs(job);
  const isOpen = job.status === 'PUBLISHED' || job.status === 'HIRING';
  const filledPercent =
    job.workersRequired > 0 ? Math.round((job.hiredCount / job.workersRequired) * 100) : 0;

  return (
    <>
      {isOpen ? <JobPostingJsonLd job={job} /> : null}

      <nav aria-label="Breadcrumb" className="border-b">
        <ol className="container-marketing text-muted-foreground flex flex-wrap items-center gap-1.5 py-3 text-sm">
          <li>
            <Link href={routes.jobs} className="hover:text-foreground">
              Jobs
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={routes.jobsByCity(job.location.citySlug)} className="hover:text-foreground">
              {job.location.city}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-foreground truncate font-medium">{job.title}</li>
        </ol>
      </nav>

      <div className="container-marketing grid gap-8 py-8 lg:grid-cols-[1fr_340px]">
        <article>
          <div className="flex flex-wrap items-center gap-2">
            <UrgencyBadge urgency={job.urgency} />
            {!isOpen ? <JobStatusBadge status={job.status} /> : null}
            <Badge variant="secondary">{job.category.name}</Badge>
          </div>

          <h1 className="mt-3 text-2xl font-bold md:text-3xl">{job.title}</h1>

          <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="size-4" aria-hidden />
              {job.company.name}
            </span>
            <CompanyVerifiedBadge verified={job.company.verification.company} />
            <span aria-hidden>·</span>
            <span>{job.publishedAt ? `Posted ${demoAgo(job.publishedAt)}` : 'Draft'}</span>
            <span aria-hidden>·</span>
            <span data-numeric>{job.viewCount} views</span>
          </div>

          <div className="bg-card mt-6 grid gap-5 rounded-lg border p-5 sm:grid-cols-2">
            <Fact
              icon={MapPin}
              label="Location"
              value={`${job.location.locality ? `${job.location.locality}, ` : ''}${job.location.city}`}
            />
            <Fact
              icon={UsersRound}
              label="Workers needed"
              value={`${job.workersRequired} (${job.vacanciesLeft} still open)`}
            />
            <Fact
              icon={CalendarDays}
              label="Starts"
              value={job.startDate ? demoDay(job.startDate) : 'Flexible'}
            />
            <Fact
              icon={Clock}
              label="Shift"
              value={
                job.workingHours
                  ? `${job.workingHours.from} – ${job.workingHours.to} · ${SHIFT_LABEL[job.shift]}`
                  : SHIFT_LABEL[job.shift]
              }
            />
            <Fact
              icon={CalendarDays}
              label="Duration"
              value={
                job.durationDays
                  ? job.durationDays >= 365
                    ? 'Long term'
                    : `${job.durationDays} days`
                  : 'Not specified'
              }
            />
            <Fact
              icon={ShieldCheck}
              label="Experience required"
              value={
                job.experienceRequiredYears === 0
                  ? 'No experience needed'
                  : `${job.experienceRequiredYears}+ years`
              }
            />
          </div>

          <section className="mt-8" aria-labelledby="about-work">
            <h2 id="about-work" className="text-lg font-semibold">
              About this work
            </h2>
            <p className="text-muted-foreground mt-3 whitespace-pre-line leading-relaxed">
              {job.description}
            </p>
          </section>

          <section className="mt-8" aria-labelledby="skills">
            <h2 id="skills" className="text-lg font-semibold">
              Skills needed
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <Link key={skill.id} href={`${routes.jobs}?skill=${skill.slug}`}>
                  <Badge variant="secondary" className="hover:bg-accent">
                    {skill.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-8" aria-labelledby="provided">
            <h2 id="provided" className="text-lg font-semibold">
              What the employer provides
            </h2>
            <ul className="text-muted-foreground mt-3 grid gap-2 sm:grid-cols-3">
              <li className="flex items-center gap-2">
                <Bed
                  className={job.perks.accommodation ? 'text-success size-4' : 'size-4 opacity-40'}
                  aria-hidden
                />
                {job.perks.accommodation ? 'Accommodation available' : 'No accommodation'}
              </li>
              <li className="flex items-center gap-2">
                <Utensils
                  className={job.perks.food ? 'text-success size-4' : 'size-4 opacity-40'}
                  aria-hidden
                />
                {job.perks.food ? 'Food provided' : 'Food not provided'}
              </li>
              <li className="flex items-center gap-2">
                <Truck
                  className={job.perks.transport ? 'text-success size-4' : 'size-4 opacity-40'}
                  aria-hidden
                />
                {job.perks.transport ? 'Transport provided' : 'No transport'}
              </li>
            </ul>
          </section>

          <section className="mt-8" aria-labelledby="location-detail">
            <h2 id="location-detail" className="text-lg font-semibold">
              Where the work is
            </h2>
            <div className="bg-card mt-3 rounded-lg border p-5">
              <p className="font-medium">{job.location.formatted}</p>
              {job.location.pincode ? (
                <p className="text-muted-foreground mt-1 text-sm" data-numeric>
                  Pincode {job.location.pincode}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={routes.jobsByCity(job.location.citySlug)}>
                    More jobs in {job.location.city}
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={routes.jobsByCityCategory(job.location.citySlug, job.category.slug)}>
                    {job.category.name} jobs in {job.location.city}
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </article>

        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="bg-card rounded-lg border p-5 shadow-[var(--shadow-card)]">
            <p className="text-muted-foreground text-sm">Pay</p>
            <p className="text-2xl font-bold" data-numeric>
              {formatRupees(job.salary.amount)}
              <span className="text-muted-foreground text-base font-normal">
                {' '}
                {SALARY_TYPE_LABEL[job.salary.type]}
              </span>
            </p>
            {job.salary.negotiable ? (
              <p className="text-muted-foreground mt-0.5 text-sm">Negotiable</p>
            ) : null}

            <Separator className="my-4" />

            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Positions filled</span>
                <span className="font-medium" data-numeric>
                  {job.hiredCount} of {job.workersRequired}
                </span>
              </div>
              <Progress value={filledPercent} />
            </div>

            <div className="mt-5 grid gap-2">
              {isOpen ? (
                <>
                  <Button variant="action" size="lg" className="w-full">
                    Apply for this job
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      <Bookmark aria-hidden />
                      Save
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 aria-hidden />
                      Share
                    </Button>
                  </div>
                </>
              ) : (
                <div className="bg-muted rounded-md p-3 text-center text-sm">
                  <p className="font-medium">This job is not accepting applications</p>
                  <p className="text-muted-foreground mt-0.5">
                    Status: {job.status.toLowerCase().replace('_', ' ')}
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                    <Link href={routes.jobsByCity(job.location.citySlug)}>
                      See similar open jobs
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            <p className="text-muted-foreground mt-4 text-xs leading-relaxed">
              Your phone number stays hidden until the employer contacts you. Never pay anyone to
              get a job on rokdajob.
            </p>
          </div>

          <div className="bg-card mt-4 rounded-lg border p-5">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
              Posted by
            </p>
            <p className="mt-2 font-semibold">{job.company.name}</p>
            <p className="text-muted-foreground text-sm capitalize">
              {job.company.type.toLowerCase().replace('_', ' ')}
            </p>
            <div className="mt-3">
              <CompanyVerifiedBadge verified={job.company.verification.company} />
            </div>
            {job.expiresAt ? (
              <p className="text-muted-foreground mt-3 text-xs">
                Listing expires {demoDate(job.expiresAt)}
              </p>
            ) : null}
          </div>
        </aside>
      </div>

      {similar.length > 0 ? (
        <section className="bg-muted/40 border-t py-12" aria-labelledby="similar">
          <div className="container-marketing">
            <h2 id="similar" className="text-xl font-bold">
              Similar jobs
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {similar.map((item) => (
                <JobCard key={item.id} job={item} compact />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
