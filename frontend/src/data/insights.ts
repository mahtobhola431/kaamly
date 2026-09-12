import type { EmployerDashboardStats, WorkerDashboardStats } from '@rokdajob/shared';
import { employerApplications, workerApplications } from './applications';
import { employerJobs, openJobs } from './jobs';
import { employerUnreadCount, workerUnreadCount } from './messaging';
import { currentWorker, workers } from './workers';
import { hoursAgo, minutesAgo } from './time';

/** Dashboard stats, activity feed, analytics series and marketing figures. */

/* ------------------------------------------------------------------ dashboards */

const hiredForEmployer = employerApplications.filter((a) => a.stage === 'HIRED').length;
const shortlistedForEmployer = employerApplications.filter((a) =>
  ['SHORTLISTED', 'CONTACTED', 'INTERVIEW', 'SELECTED'].includes(a.stage),
).length;

export const employerDashboardStats: EmployerDashboardStats = {
  activeJobs: employerJobs.filter((job) => job.status === 'HIRING' || job.status === 'PUBLISHED')
    .length,
  totalApplicants: employerApplications.length,
  shortlisted: shortlistedForEmployer,
  hired: hiredForEmployer,
  jobsCompleted: employerJobs.filter((job) => job.status === 'COMPLETED').length,
  openPositions: employerJobs
    .filter((job) => job.status === 'HIRING' || job.status === 'PUBLISHED')
    .reduce((total, job) => total + job.vacanciesLeft, 0),
  hiringConversionRate:
    employerApplications.length > 0
      ? Math.round((hiredForEmployer / employerApplications.length) * 100)
      : 0,
  availableWorkersNearby: workers.filter((worker) => worker.availability === 'AVAILABLE_NOW')
    .length,
};

export const workerDashboardStats: WorkerDashboardStats = {
  nearbyJobs: 12,
  recommendedJobs: 5,
  activeApplications: workerApplications.filter(
    (application) => !['REJECTED', 'WITHDRAWN'].includes(application.stage),
  ).length,
  shortlisted: workerApplications.filter((application) =>
    ['SHORTLISTED', 'CONTACTED', 'INTERVIEW', 'SELECTED'].includes(application.stage),
  ).length,
  unreadMessages: workerUnreadCount,
  profileCompletion: currentWorker.profileCompletion,
};

export const employerInboxUnread = employerUnreadCount;

/* -------------------------------------------------------------- activity feed */

export interface ActivityEvent {
  id: string;
  at: string;
  kind: 'APPLIED' | 'SHORTLISTED' | 'CONTACTED' | 'HIRED' | 'REJECTED' | 'POSTED' | 'REVIEW';
  actor: string;
  summary: string;
  context?: string;
}

export const employerActivity: ActivityEvent[] = [
  {
    id: 'act_1',
    at: minutesAgo(18),
    kind: 'APPLIED',
    actor: 'Jitendra Rathod',
    summary: 'applied for',
    context: 'Need 15 construction helpers for warehouse site',
  },
  {
    id: 'act_2',
    at: minutesAgo(52),
    kind: 'HIRED',
    actor: 'Sunil Yadav',
    summary: 'was hired for',
    context: 'Need 15 construction helpers for warehouse site',
  },
  {
    id: 'act_3',
    at: hoursAgo(2),
    kind: 'SHORTLISTED',
    actor: 'Manoj Mishra',
    summary: 'was shortlisted for',
    context: 'Need 15 construction helpers for warehouse site',
  },
  {
    id: 'act_4',
    at: hoursAgo(3),
    kind: 'CONTACTED',
    actor: 'Nadeem Khan',
    summary: 'was contacted about',
    context: 'Tile and marble fitters — Okhla',
  },
  {
    id: 'act_5',
    at: hoursAgo(6),
    kind: 'REJECTED',
    actor: 'Ravi Verma',
    summary: 'was rejected for',
    context: 'Need 15 construction helpers for warehouse site',
  },
  {
    id: 'act_6',
    at: hoursAgo(12),
    kind: 'POSTED',
    actor: 'You',
    summary: 'posted',
    context: 'Arc welders for railing fabrication',
  },
  {
    id: 'act_7',
    at: hoursAgo(20),
    kind: 'HIRED',
    actor: 'Imran Shaikh',
    summary: 'was hired for',
    context: 'Electricians for residential tower wiring',
  },
  {
    id: 'act_8',
    at: hoursAgo(30),
    kind: 'REVIEW',
    actor: 'You',
    summary: 'rated',
    context: 'Rajesh Kumar — 5 stars',
  },
];

/* ----------------------------------------------------------------- analytics */

export const applicationsTrend = [
  { week: 'W1', applications: 34, hires: 4 },
  { week: 'W2', applications: 41, hires: 6 },
  { week: 'W3', applications: 28, hires: 3 },
  { week: 'W4', applications: 52, hires: 9 },
  { week: 'W5', applications: 47, hires: 7 },
  { week: 'W6', applications: 61, hires: 11 },
  { week: 'W7', applications: 58, hires: 8 },
  { week: 'W8', applications: 73, hires: 14 },
];

export const hiringFunnel = [
  { stage: 'Applied', count: 394 },
  { stage: 'Reviewed', count: 268 },
  { stage: 'Shortlisted', count: 141 },
  { stage: 'Contacted', count: 96 },
  { stage: 'Interviewed', count: 62 },
  { stage: 'Hired', count: 41 },
];

export const skillDemand = [
  { skill: 'Helper', count: 62 },
  { skill: 'Mason', count: 48 },
  { skill: 'Electrician', count: 37 },
  { skill: 'Loader', count: 34 },
  { skill: 'Plumber', count: 26 },
  { skill: 'Welder', count: 21 },
];

export const timeToHire = [
  { month: 'Mar', days: 6.4 },
  { month: 'Apr', days: 5.8 },
  { month: 'May', days: 5.1 },
  { month: 'Jun', days: 4.6 },
  { month: 'Jul', days: 4.2 },
  { month: 'Aug', days: 3.7 },
];

/* ------------------------------------------------------- marketing figures */

/**
 * Landing-page figures. These are demo numbers for a pre-launch product and are labelled
 * as such in the UI — never presented as audited platform metrics.
 */
export const platformStats = [
  { label: 'Workers on the platform', value: 12480, suffix: '+' },
  { label: 'Jobs posted this month', value: 1960, suffix: '+' },
  { label: 'Cities covered', value: 15, suffix: '' },
  { label: 'Average time to first applicant', value: 22, suffix: ' min' },
];

export const testimonials = [
  {
    quote:
      'I needed 15 helpers in Bhiwandi by Monday. Posted on Sunday evening and had 27 applications before lunch the next day.',
    name: 'Nitin Deshmukh',
    role: 'Project Manager, Shreeji Infra Contractors',
    location: 'Mumbai',
  },
  {
    quote:
      'Earlier I used to sit at the naka every morning hoping for work. Now I get messages for jobs within 10 km of my room.',
    name: 'Sunil Yadav',
    role: 'Construction helper',
    location: 'Bhiwandi',
  },
  {
    quote:
      'The pipeline view is what we actually needed. We can see who is shortlisted across four sites without a single WhatsApp group.',
    name: 'Sunita Rane',
    role: 'HR Manager, Aadhar Buildcon',
    location: 'Navi Mumbai',
  },
  {
    quote:
      'Rates and shift timings are written clearly on every job. I do not waste a day travelling to find out the pay is different.',
    name: 'Imran Shaikh',
    role: 'Electrician',
    location: 'Mumbai',
  },
];

export const howItWorksEmployer = [
  {
    title: 'Post what you need',
    body: 'Job title, location, how many workers, the rate and the start date. Two minutes, no forms to download.',
  },
  {
    title: 'See who is nearby',
    body: 'Applications arrive with distance, skills, experience, expected wage and availability already filled in.',
  },
  {
    title: 'Shortlist and contact',
    body: 'Move people through your pipeline, message them in the app, and reveal a phone number only when you need it.',
  },
  {
    title: 'Hire and keep the crew',
    body: 'Hiring updates the vacancy count automatically. Keep the workers who did well in a team for the next site.',
  },
];

export const howItWorksWorker = [
  {
    title: 'Make your profile',
    body: 'Your trade, years of experience, area and expected wage. Add your phone number and verify it once.',
  },
  {
    title: 'See work near you',
    body: 'Jobs are sorted by distance from where you live, with the daily rate shown before you apply.',
  },
  {
    title: 'Apply in one tap',
    body: 'No resume, no typing. The employer sees your skills, rating and how far away you are.',
  },
  {
    title: 'Get contacted',
    body: 'Employers message you in the app. Your phone number stays hidden until you are in touch.',
  },
];

export const trustSignals = [
  {
    title: 'Email verified',
    body: 'Every account confirms a working email address before it can apply or post.',
  },
  {
    title: 'Profile verified',
    body: 'Our team reviews worker profiles for a real trade, a real area and consistent work history.',
  },
  {
    title: 'Company verified',
    body: 'Employers submit business details before their jobs are marked verified on the platform.',
  },
  {
    title: 'Ratings after every job',
    body: 'Both sides rate each other once work finishes. One review per job, so scores cannot be inflated.',
  },
  {
    title: 'Your number stays private',
    body: 'Worker phone numbers are hidden on public profiles and revealed only after contact is established.',
  },
  {
    title: 'Report and block',
    body: 'Any job or account can be reported. Our moderation team reviews reports and suspends bad actors.',
  },
];

export const faqs = [
  {
    q: 'Is rokdajob free for workers?',
    a: 'Yes. Creating a profile, searching for jobs and applying is free for workers, and always will be.',
  },
  {
    q: 'How do employers pay?',
    a: 'Posting your first jobs is free. Paid plans add larger worker searches, bulk invites and CRM seats for your team.',
  },
  {
    q: 'Do you handle wages or payments?',
    a: 'No. Wages are settled directly between the employer and the worker. rokdajob is where you find each other and keep track of the hiring.',
  },
  {
    q: 'Which cities do you cover?',
    a: 'We are starting with 15 cities including Mumbai, Thane, Navi Mumbai, Bhiwandi, Pune, Delhi NCR, Bengaluru, Ahmedabad and Surat.',
  },
  {
    q: 'What does "verified" mean?',
    a: 'It means we checked something specific: an email address by confirmation link, a worker profile by manual review, or a company by its business details. We never claim any government verification we have not done.',
  },
  {
    q: 'Can I hire the same workers again?',
    a: 'Yes. Workers you have hired stay in your worker database, and you can group them into teams for future sites.',
  },
];

export const publicJobCount = openJobs.length;
