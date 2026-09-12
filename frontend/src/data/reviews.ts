import type { Review } from '@rokdajob/shared';
import { employerByCompanySlug } from './companies';
import { jobOf } from './jobs';
import { workerOf } from './workers';
import { daysAgo } from './time';

/**
 * Two-way reviews written after a job completes.
 * The API enforces one review per (job, author, subject) with a unique index; the demo
 * data respects the same rule.
 */

interface ReviewSeed {
  worker: string;
  companySlug: string;
  job: string;
  direction: 'EMPLOYER_TO_WORKER' | 'WORKER_TO_EMPLOYER';
  rating: number;
  comment: string;
  daysAgo: number;
  categories: {
    workQuality?: number;
    reliability?: number;
    communication?: number;
    punctuality?: number;
  };
}

const REVIEW_SEEDS: ReviewSeed[] = [
  {
    worker: 'rajesh-kumar',
    companySlug: 'shreeji-infra-contractors',
    job: 'helpers-dadar-renovation',
    direction: 'EMPLOYER_TO_WORKER',
    rating: 5,
    comment:
      'Finished the Dadar shop work ahead of schedule. Managed the helpers well and the finishing was clean. Will hire again.',
    daysAgo: 22,
    categories: { workQuality: 5, reliability: 5, communication: 4, punctuality: 5 },
  },
  {
    worker: 'rajesh-kumar',
    companySlug: 'shreeji-infra-contractors',
    job: 'helpers-dadar-renovation',
    direction: 'WORKER_TO_EMPLOYER',
    rating: 5,
    comment: 'Payment was on time every week. Site had proper water and toilet facility.',
    daysAgo: 21,
    categories: { reliability: 5, communication: 5 },
  },
  {
    worker: 'firoz-ansari',
    companySlug: 'shreeji-infra-contractors',
    job: 'helpers-dadar-renovation',
    direction: 'EMPLOYER_TO_WORKER',
    rating: 4,
    comment: 'Good welding quality. Sometimes reached site 30 minutes late.',
    daysAgo: 24,
    categories: { workQuality: 5, reliability: 4, communication: 4, punctuality: 3 },
  },
  {
    worker: 'sunil-yadav',
    companySlug: 'shreeji-infra-contractors',
    job: 'helpers-dadar-renovation',
    direction: 'EMPLOYER_TO_WORKER',
    rating: 4,
    comment: 'Hard working and never took unplanned leave. Needs some guidance on finishing work.',
    daysAgo: 25,
    categories: { workQuality: 4, reliability: 5, communication: 4, punctuality: 5 },
  },
  {
    worker: 'pravin-jadhav',
    companySlug: 'precision-auto-components',
    job: 'canteen-cooks-hadapsar',
    direction: 'WORKER_TO_EMPLOYER',
    rating: 4,
    comment: 'Company bus and canteen are good. Shift rotation notice could be given earlier.',
    daysAgo: 15,
    categories: { reliability: 4, communication: 3 },
  },
  {
    worker: 'ashok-tiwari',
    companySlug: 'greenleaf-facility',
    job: 'security-guards-thane-it-park',
    direction: 'EMPLOYER_TO_WORKER',
    rating: 5,
    comment: 'Very disciplined, handles visitor management calmly during peak hours.',
    daysAgo: 8,
    categories: { workQuality: 5, reliability: 5, communication: 5, punctuality: 5 },
  },
  {
    worker: 'santosh-more',
    companySlug: 'urbanfix-services',
    job: 'ac-technicians-mumbai-suburbs',
    direction: 'EMPLOYER_TO_WORKER',
    rating: 5,
    comment: 'Customers specifically ask for him. Zero repeat complaints in three months.',
    daysAgo: 5,
    categories: { workQuality: 5, reliability: 5, communication: 5, punctuality: 4 },
  },
];

export const reviews: Review[] = REVIEW_SEEDS.map((seed, index) => {
  const worker = workerOf(seed.worker);
  const employer = employerByCompanySlug[seed.companySlug];
  if (!employer) throw new Error(`No employer for company ${seed.companySlug}`);
  const job = jobOf(seed.job);
  const at = daysAgo(seed.daysAgo);

  const employerToWorker = seed.direction === 'EMPLOYER_TO_WORKER';

  return {
    id: `rev_${index + 1}`,
    job: { id: job.id, title: job.title, slug: job.slug },
    author: employerToWorker ? employer.user : worker.user,
    subject: employerToWorker ? worker.user : employer.user,
    direction: seed.direction,
    rating: seed.rating,
    categories: seed.categories,
    comment: seed.comment,
    createdAt: at,
    updatedAt: at,
  };
});

export function reviewsForWorker(workerUserId: string): Review[] {
  return reviews.filter(
    (review) => review.direction === 'EMPLOYER_TO_WORKER' && review.subject.id === workerUserId,
  );
}

export function reviewsForEmployer(employerUserId: string): Review[] {
  return reviews.filter(
    (review) => review.direction === 'WORKER_TO_EMPLOYER' && review.subject.id === employerUserId,
  );
}

/** Reviews the demo employer has written, shown on the CRM activity feed. */
export const reviewsByEmployer = reviews.filter(
  (review) => review.direction === 'EMPLOYER_TO_WORKER',
);
