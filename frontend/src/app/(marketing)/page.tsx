import type { Metadata } from 'next';
import { BRAND } from '@rokdajob/shared';
import { JobList } from '@/components/domain/job-card';
import { WorkerGrid } from '@/components/domain/worker-card';
import { CategoryGrid } from '@/components/marketing/category-grid';
import { Hero } from '@/components/marketing/hero';
import { HowItWorks } from '@/components/marketing/how-it-works';
import { LocationGrid } from '@/components/marketing/location-grid';
import { Section } from '@/components/marketing/section';
import {
  AudienceSplit,
  CtaBand,
  FaqList,
  FeatureList,
  StatsRow,
  Testimonials,
} from '@/components/marketing/sections';
import {
  faqs,
  howItWorksEmployer,
  howItWorksWorker,
  platformStats,
  testimonials,
  trustSignals,
} from '@/data/insights';
import { getCategories, getFeaturedCities, getCities, getPopularSkills } from '@/lib/data/catalog';
import { getJob, getJobCountsByCategory, getJobCountsByCity, getLatestJobs } from '@/lib/data/jobs';
import { getWorker, getWorkerCountsByCity, searchWorkers } from '@/lib/data/workers';

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description:
    'Find skilled and reliable workers near your worksite, post jobs, manage applicants, and build your workforce from one place. Masons, electricians, plumbers, helpers, warehouse staff and more across 15 Indian cities.',
  alternates: { canonical: '/' },
};

export default async function LandingPage() {
  const [
    cities,
    featuredCities,
    categories,
    popularSkills,
    latestJobs,
    jobsByCity,
    jobsByCategory,
    workersByCity,
    availableWorkers,
    featuredWorker,
    featuredJob,
  ] = await Promise.all([
    getCities(),
    getFeaturedCities(),
    getCategories(),
    getPopularSkills(),
    getLatestJobs(6),
    getJobCountsByCity(),
    getJobCountsByCategory(),
    getWorkerCountsByCity(),
    searchWorkers({ availability: ['AVAILABLE_NOW'], sort: 'rating', limit: 6 }),
    getWorker('wpr_rajesh-kumar'),
    getJob('construction-helpers-bhiwandi-warehouse-site'),
  ]);

  return (
    <>
      {featuredWorker && featuredJob ? (
        <Hero
          cities={cities}
          popularSkills={popularSkills}
          featuredWorker={featuredWorker}
          featuredJob={featuredJob}
        />
      ) : null}

      <Section
        id="how"
        eyebrow="How it works"
        title="Hiring and finding work, without the middleman"
        description="The same platform read from both sides. Pick yours."
      >
        <HowItWorks employerSteps={howItWorksEmployer} workerSteps={howItWorksWorker} />
      </Section>

      <Section
        id="categories"
        tone="muted"
        eyebrow="Work categories"
        title="Every trade a site actually needs"
        description="Categories are managed in the admin panel, so new trades can be added without a release."
        action={{ href: '/categories', label: 'Browse all categories' }}
      >
        <CategoryGrid categories={categories} counts={jobsByCategory} />
      </Section>

      <Section
        id="jobs"
        eyebrow="Hiring now"
        title="Latest jobs across India"
        description="Rate, shift timing and number of openings are written on every post."
        action={{ href: '/jobs', label: 'See all jobs' }}
      >
        <JobList jobs={latestJobs} />
      </Section>

      <Section
        id="workers"
        tone="muted"
        eyebrow="Available now"
        title="Workers ready to start"
        description="Sorted by rating. Distance is calculated from your worksite when you search."
        action={{ href: '/workers', label: 'Search all workers' }}
      >
        <WorkerGrid workers={availableWorkers.items} />
      </Section>

      <Section
        id="locations"
        eyebrow="Locations"
        title="Popular hiring locations"
        description="Live in 15 cities, with localities and pincodes mapped for accurate distance search."
        action={{ href: '/locations', label: 'All locations' }}
      >
        <LocationGrid cities={featuredCities} workerCounts={workersByCity} jobCounts={jobsByCity} />
      </Section>

      <Section
        id="audiences"
        tone="muted"
        eyebrow="Two sides"
        title="Built for both ends of the site gate"
      >
        <AudienceSplit />
      </Section>

      <Section
        id="trust"
        eyebrow="Trust and safety"
        title="We only claim what we actually check"
        description="No badge on this platform implies a government verification we have not carried out."
      >
        <FeatureList items={trustSignals} />
      </Section>

      <Section
        id="stats"
        tone="navy"
        eyebrow="By the numbers"
        title="Growing across India's industrial belts"
        description="Figures shown are from our launch dataset while we onboard the first cities."
        align="center"
      >
        <StatsRow stats={platformStats} />
      </Section>

      <Section
        id="testimonials"
        eyebrow="From the field"
        title="What contractors and workers say"
        align="center"
      >
        <Testimonials items={testimonials} />
      </Section>

      <Section id="faq" tone="muted" title="Common questions">
        <FaqList items={faqs} />
      </Section>

      <CtaBand />
    </>
  );
}
