import type {
  Application,
  ApplicationStage,
  Company,
  EmployerDashboardStats,
  EmployerProfile,
  Job,
  JobStatus,
  Team,
  WorkerProfile,
} from '@rokdajob/shared';
import { applicationsForJob, employerApplications, employerWorkerPool } from '@/data/applications';
import { currentEmployer } from '@/data/companies';
import { employerJobs } from '@/data/jobs';
import {
  applicationsTrend,
  employerActivity,
  employerDashboardStats,
  hiringFunnel,
  skillDemand,
  timeToHire,
  type ActivityEvent,
} from '@/data/insights';
import { teams } from '@/data/teams';

/** Everything the employer CRM reads. Maps 1:1 onto the `/employer/*` API routes. */

export async function getCurrentEmployer(): Promise<EmployerProfile> {
  return currentEmployer;
}

export async function getEmployerCompany(): Promise<Company> {
  return currentEmployer.company;
}

export async function getEmployerDashboard(): Promise<EmployerDashboardStats> {
  return employerDashboardStats;
}

export interface EmployerJobFilters {
  status?: JobStatus[];
  q?: string;
}

export async function getEmployerJobs(filters: EmployerJobFilters = {}): Promise<Job[]> {
  let list = [...employerJobs];

  if (filters.status?.length) {
    list = list.filter((job) => filters.status?.includes(job.status));
  }
  if (filters.q?.trim()) {
    const q = filters.q.toLowerCase();
    list = list.filter(
      (job) =>
        job.title.toLowerCase().includes(q) || job.location.formatted.toLowerCase().includes(q),
    );
  }

  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getEmployerJob(slug: string): Promise<Job | null> {
  return employerJobs.find((job) => job.slug === slug) ?? null;
}

export interface EmployerApplicationFilters {
  jobSlug?: string;
  stage?: ApplicationStage[];
  q?: string;
}

export async function getEmployerApplications(
  filters: EmployerApplicationFilters = {},
): Promise<Application[]> {
  let list = filters.jobSlug ? applicationsForJob(filters.jobSlug) : [...employerApplications];

  if (filters.stage?.length) {
    list = list.filter((application) => filters.stage?.includes(application.stage));
  }
  if (filters.q?.trim()) {
    const q = filters.q.toLowerCase();
    list = list.filter(
      (application) =>
        application.worker.name.toLowerCase().includes(q) ||
        application.job.title.toLowerCase().includes(q),
    );
  }

  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Applications grouped into pipeline columns, in board order. */
export async function getPipeline(
  jobSlug?: string,
): Promise<Record<ApplicationStage, Application[]>> {
  const list = await getEmployerApplications(jobSlug ? { jobSlug } : {});
  const grouped = {} as Record<ApplicationStage, Application[]>;
  for (const application of list) {
    (grouped[application.stage] ??= []).push(application);
  }
  return grouped;
}

export interface EmployerWorkerRecord {
  worker: WorkerProfile;
  lastWorked: string | null;
  stage: ApplicationStage;
  jobTitle: string;
}

export async function getEmployerWorkers(q?: string): Promise<EmployerWorkerRecord[]> {
  let list: EmployerWorkerRecord[] = employerWorkerPool.map((entry) => ({
    worker: entry.worker,
    lastWorked: entry.lastWorked,
    stage: entry.application.stage,
    jobTitle: entry.application.job.title,
  }));

  if (q?.trim()) {
    const needle = q.toLowerCase();
    list = list.filter(
      (record) =>
        record.worker.user.name.toLowerCase().includes(needle) ||
        record.worker.skills.some((entry) => entry.skill.name.toLowerCase().includes(needle)),
    );
  }

  return list;
}

export async function getTeams(): Promise<Team[]> {
  return teams;
}

export async function getTeam(id: string): Promise<Team | null> {
  return teams.find((team) => team.id === id) ?? null;
}

export async function getEmployerActivity(): Promise<ActivityEvent[]> {
  return employerActivity;
}

export interface EmployerAnalytics {
  applicationsTrend: typeof applicationsTrend;
  hiringFunnel: typeof hiringFunnel;
  skillDemand: typeof skillDemand;
  timeToHire: typeof timeToHire;
}

export async function getEmployerAnalytics(): Promise<EmployerAnalytics> {
  return { applicationsTrend, hiringFunnel, skillDemand, timeToHire };
}

export type { ActivityEvent };
