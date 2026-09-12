import type { Application, ApplicationStage, ApplicationStageEvent } from '@rokdajob/shared';
import { currentEmployer, employerByCompanySlug } from './companies';
import { jobOf } from './jobs';
import { currentWorker, workerOf } from './workers';
import { daysAgo, hoursAgo } from './time';

/**
 * Demo applications, arranged so the employer pipeline board at `/e/applicants` has a
 * believable spread across every stage and the vacancy maths on each job adds up.
 */

interface ApplicationSeed {
  job: string;
  worker: string;
  stage: ApplicationStage;
  source?: 'APPLIED' | 'INVITED';
  appliedHoursAgo: number;
  coverNote?: string;
  rejectionReason?: string;
}

const APPLICATION_SEEDS: ApplicationSeed[] = [
  // Construction helpers, Bhiwandi — the employer's most active post
  {
    job: 'construction-helpers-bhiwandi-warehouse-site',
    worker: 'sunil-yadav',
    stage: 'HIRED',
    appliedHoursAgo: 2,
    coverNote: 'I stay in Kalher itself, can join from tomorrow morning.',
  },
  {
    job: 'construction-helpers-bhiwandi-warehouse-site',
    worker: 'ramesh-gupta',
    stage: 'SELECTED',
    appliedHoursAgo: 2,
    coverNote: 'Have done warehouse shed work before. Available immediately.',
  },
  {
    job: 'construction-helpers-bhiwandi-warehouse-site',
    worker: 'manoj-mishra',
    stage: 'SHORTLISTED',
    appliedHoursAgo: 1,
  },
  {
    job: 'construction-helpers-bhiwandi-warehouse-site',
    worker: 'balu-kamble',
    stage: 'INTERVIEW',
    appliedHoursAgo: 3,
    coverNote: 'Can bring two more helpers with me if needed.',
  },
  {
    job: 'construction-helpers-bhiwandi-warehouse-site',
    worker: 'lakshmi-devi',
    stage: 'REVIEWED',
    appliedHoursAgo: 2,
  },
  {
    job: 'construction-helpers-bhiwandi-warehouse-site',
    worker: 'jitendra-rathod',
    stage: 'APPLIED',
    appliedHoursAgo: 1,
  },
  {
    job: 'construction-helpers-bhiwandi-warehouse-site',
    worker: 'ravi-verma',
    stage: 'REJECTED',
    appliedHoursAgo: 3,
    rejectionReason: 'Looking for painting work, not helper work',
  },

  // Electricians, Andheri
  {
    job: 'electricians-andheri-residential-tower',
    worker: 'imran-shaikh',
    stage: 'HIRED',
    appliedHoursAgo: 18,
    coverNote: 'ITI certified, have done full tower wiring in Goregaon last year.',
  },
  {
    job: 'electricians-andheri-residential-tower',
    worker: 'vijay-solanki',
    stage: 'CONTACTED',
    source: 'INVITED',
    appliedHoursAgo: 14,
  },
  {
    job: 'electricians-andheri-residential-tower',
    worker: 'santosh-more',
    stage: 'SHORTLISTED',
    appliedHoursAgo: 10,
    coverNote: 'Mainly AC work but comfortable with wiring too.',
  },
  {
    job: 'electricians-andheri-residential-tower',
    worker: 'manoj-mishra',
    stage: 'REJECTED',
    appliedHoursAgo: 16,
    rejectionReason: 'Not enough electrical experience for this site',
  },

  // Painters, Chembur
  {
    job: 'painters-chembur-flats',
    worker: 'ravi-verma',
    stage: 'SHORTLISTED',
    appliedHoursAgo: 22,
    coverNote: 'Team of three painters, we can finish 3 flats a week.',
  },
  { job: 'painters-chembur-flats', worker: 'prakash-behera', stage: 'APPLIED', appliedHoursAgo: 8 },
  { job: 'painters-chembur-flats', worker: 'manoj-mishra', stage: 'APPLIED', appliedHoursAgo: 5 },

  // Welders, Kalwa
  {
    job: 'welders-kalwa-fabrication',
    worker: 'firoz-ansari',
    stage: 'HIRED',
    appliedHoursAgo: 10,
    coverNote: 'Arc and MIG both. Have own helmet and gloves.',
  },
  {
    job: 'welders-kalwa-fabrication',
    worker: 'balu-kamble',
    stage: 'REVIEWED',
    appliedHoursAgo: 7,
  },
  {
    job: 'welders-kalwa-fabrication',
    worker: 'jitendra-rathod',
    stage: 'APPLIED',
    appliedHoursAgo: 4,
  },

  // Tile workers, Okhla
  {
    job: 'tile-workers-okhla',
    worker: 'nadeem-khan',
    stage: 'CONTACTED',
    appliedHoursAgo: 60,
    coverNote: 'Doing similar commercial flooring in Okhla currently, free from next week.',
  },
  { job: 'tile-workers-okhla', worker: 'rajesh-kumar', stage: 'APPLIED', appliedHoursAgo: 30 },

  // Site supervisor draft has no applicants; masons at Panvel (other employer)
  {
    job: 'masons-panvel-tower-slab',
    worker: 'rajesh-kumar',
    stage: 'SHORTLISTED',
    appliedHoursAgo: 40,
    coverNote: 'Can lead a team of 5 helpers. Have worked on G+12 towers.',
  },
  {
    job: 'masons-panvel-tower-slab',
    worker: 'arjun-singh',
    stage: 'REVIEWED',
    appliedHoursAgo: 36,
  },
  { job: 'masons-panvel-tower-slab', worker: 'nadeem-khan', stage: 'APPLIED', appliedHoursAgo: 12 },

  // Worker-side applications for the demo worker (Rajesh Kumar)
  {
    job: 'carpenters-whitefield-interiors',
    worker: 'rajesh-kumar',
    stage: 'REJECTED',
    appliedHoursAgo: 100,
    rejectionReason: 'Position filled locally',
  },
  {
    job: 'helpers-dadar-renovation',
    worker: 'rajesh-kumar',
    stage: 'HIRED',
    appliedHoursAgo: 880,
  },
  {
    job: 'construction-helpers-bhiwandi-warehouse-site',
    worker: 'rajesh-kumar',
    stage: 'INTERVIEW',
    source: 'INVITED',
    appliedHoursAgo: 2,
  },

  // Warehouse posts
  {
    job: 'warehouse-loaders-night-shift-bhiwandi',
    worker: 'ramesh-gupta',
    stage: 'HIRED',
    appliedHoursAgo: 28,
  },
  {
    job: 'warehouse-loaders-night-shift-bhiwandi',
    worker: 'sunil-yadav',
    stage: 'SELECTED',
    appliedHoursAgo: 26,
  },
  {
    job: 'packers-manesar-ecommerce',
    worker: 'harpreet-kaur',
    stage: 'CONTACTED',
    appliedHoursAgo: 15,
  },
  {
    job: 'forklift-operators-taloja',
    worker: 'ganesh-sawant',
    stage: 'SHORTLISTED',
    appliedHoursAgo: 45,
    coverNote: 'Licence valid till 2029, reach truck experience 3 years.',
  },
  {
    job: 'security-guards-thane-it-park',
    worker: 'ashok-tiwari',
    stage: 'SELECTED',
    appliedHoursAgo: 120,
  },
  {
    job: 'housekeeping-staff-vashi',
    worker: 'shabana-parveen',
    stage: 'REVIEWED',
    appliedHoursAgo: 50,
  },
  {
    job: 'housekeeping-staff-vashi',
    worker: 'kavita-shinde',
    stage: 'INTERVIEW',
    appliedHoursAgo: 48,
  },
  {
    job: 'cnc-operators-chakan-plant',
    worker: 'pravin-jadhav',
    stage: 'HIRED',
    appliedHoursAgo: 90,
  },
  {
    job: 'maintenance-fitters-chakan',
    worker: 'karthik-raju',
    stage: 'APPLIED',
    appliedHoursAgo: 70,
  },
  {
    job: 'ac-technicians-mumbai-suburbs',
    worker: 'santosh-more',
    stage: 'HIRED',
    appliedHoursAgo: 5,
  },
  {
    job: 'plumbers-thane-society-amc',
    worker: 'mahesh-patil',
    stage: 'SHORTLISTED',
    appliedHoursAgo: 40,
    coverNote: 'Already doing AMC for two societies in Wagle Estate.',
  },
  {
    job: 'drivers-tempo-mumbai-thane',
    worker: 'deepak-chauhan',
    stage: 'CONTACTED',
    appliedHoursAgo: 30,
  },
];

/** Stages an application passes through on its way to its current stage. */
const STAGE_PATH: Record<ApplicationStage, ApplicationStage[]> = {
  APPLIED: ['APPLIED'],
  REVIEWED: ['APPLIED', 'REVIEWED'],
  SHORTLISTED: ['APPLIED', 'REVIEWED', 'SHORTLISTED'],
  CONTACTED: ['APPLIED', 'REVIEWED', 'SHORTLISTED', 'CONTACTED'],
  INTERVIEW: ['APPLIED', 'REVIEWED', 'SHORTLISTED', 'CONTACTED', 'INTERVIEW'],
  SELECTED: ['APPLIED', 'REVIEWED', 'SHORTLISTED', 'CONTACTED', 'INTERVIEW', 'SELECTED'],
  HIRED: ['APPLIED', 'REVIEWED', 'SHORTLISTED', 'CONTACTED', 'INTERVIEW', 'SELECTED', 'HIRED'],
  REJECTED: ['APPLIED', 'REVIEWED', 'REJECTED'],
  WITHDRAWN: ['APPLIED', 'WITHDRAWN'],
};

function buildHistory(seed: ApplicationSeed): ApplicationStageEvent[] {
  const path = STAGE_PATH[seed.stage];
  const span = Math.max(seed.appliedHoursAgo, path.length);
  const step = span / path.length;

  return path.map((stage, index) => ({
    stage,
    at: hoursAgo(Math.max(seed.appliedHoursAgo - index * step, 0.2)),
    ...(stage === 'REJECTED' && seed.rejectionReason ? { note: seed.rejectionReason } : {}),
  }));
}

function buildApplication(seed: ApplicationSeed, index: number): Application {
  const job = jobOf(seed.job);
  const worker = workerOf(seed.worker);
  const employer = employerByCompanySlug[job.company.slug];
  if (!employer) throw new Error(`No employer for job ${seed.job}`);

  const history = buildHistory(seed);
  const last = history[history.length - 1] as ApplicationStageEvent;

  return {
    id: `app_${index + 1}_${seed.worker}`,
    job: {
      id: job.id,
      title: job.title,
      slug: job.slug,
      location: job.location,
      salary: job.salary,
      status: job.status,
      workersRequired: job.workersRequired,
    },
    worker: worker.user,
    workerProfile: worker,
    employer: employer.user,
    stage: seed.stage,
    source: seed.source ?? 'APPLIED',
    ...(seed.coverNote ? { coverNote: seed.coverNote } : {}),
    expectedWage: worker.expectedWage,
    stageHistory: history,
    ...(seed.rejectionReason ? { rejectionReason: seed.rejectionReason } : {}),
    ...(seed.stage === 'HIRED' ? { hiredAt: last.at } : {}),
    createdAt: hoursAgo(seed.appliedHoursAgo),
    updatedAt: last.at,
  };
}

export const applications: Application[] = APPLICATION_SEEDS.map(buildApplication);

export const applicationById: Record<string, Application> = Object.fromEntries(
  applications.map((application) => [application.id, application]),
);

/** Applications the demo employer sees in their CRM. */
export const employerApplications: Application[] = applications.filter(
  (application) => application.employer.id === currentEmployer.user.id,
);

/** Applications the demo worker sees under "My applications". */
export const workerApplications: Application[] = applications
  .filter((application) => application.worker.id === currentWorker.user.id)
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export function applicationsForJob(jobSlug: string): Application[] {
  return applications.filter((application) => application.job.slug === jobSlug);
}

export function applicationsByStage(list: Application[]): Record<ApplicationStage, Application[]> {
  const grouped = {} as Record<ApplicationStage, Application[]>;
  for (const application of list) {
    (grouped[application.stage] ??= []).push(application);
  }
  return grouped;
}

/** Workers this employer has hired at least once — the CRM's worker database. */
export const employerWorkerPool = applications
  .filter(
    (application) =>
      application.employer.id === currentEmployer.user.id &&
      ['HIRED', 'SELECTED', 'CONTACTED', 'SHORTLISTED'].includes(application.stage),
  )
  .map((application) => ({
    application,
    worker: workerOf(application.worker.id.replace('usr_wrk_', '')),
    lastWorked: application.stage === 'HIRED' ? (application.hiredAt ?? daysAgo(10)) : null,
  }));
