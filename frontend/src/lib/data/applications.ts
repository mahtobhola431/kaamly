import type { Application, ApplicationStage, PaginationMeta, Wage } from '@rokdajob/shared';
import { api } from '@/lib/api/client';

/**
 * Applying, withdrawing, and the worker's own list — `/jobs/:id/apply` and
 * `/me/applications`. Browser-only: the access token is not reachable from a server render.
 */

export interface ApplyInput {
  coverNote?: string;
  expectedWage?: Wage;
  /** Saved to the account when the worker has not given one before. */
  phone?: string;
}

export async function applyToJob(jobId: string, input: ApplyInput = {}): Promise<Application> {
  return api.post<Application>(`/jobs/${jobId}/apply`, input);
}

/** The caller's application to one job, or `null` when they have not applied. */
export async function getMyApplicationForJob(idOrSlug: string): Promise<Application | null> {
  return api.get<Application | null>(`/jobs/${encodeURIComponent(idOrSlug)}/my-application`);
}

export interface MyApplicationsParams {
  stage?: ApplicationStage;
  /** Hides withdrawn and rejected rows. */
  active?: boolean;
  page?: number;
  limit?: number;
}

export async function getMyApplications(
  params: MyApplicationsParams = {},
): Promise<{ items: Application[]; meta: PaginationMeta }> {
  return api.list<Application>('/me/applications', {
    query: {
      ...(params.stage ? { stage: params.stage } : {}),
      ...(params.active ? { active: 'true' } : {}),
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    },
  });
}

/** Counts per stage, plus `total`, for the tabs on the applications screen. */
export async function getMyApplicationCounts(): Promise<Record<string, number>> {
  return api.get<Record<string, number>>('/me/applications/counts');
}

/* ------------------------------------------------------------ employer's board */

export interface EmployerApplicationsParams {
  stage?: ApplicationStage;
  /** Job id — the board's per-job filter. */
  job?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export async function getEmployerApplications(
  params: EmployerApplicationsParams = {},
): Promise<{ items: Application[]; meta: PaginationMeta }> {
  return api.list<Application>('/employer/applications', {
    query: {
      ...(params.stage ? { stage: params.stage } : {}),
      ...(params.job ? { job: params.job } : {}),
      ...(params.q ? { q: params.q } : {}),
      page: params.page ?? 1,
      limit: params.limit ?? 50,
    },
  });
}

/** The middle of the pipeline only; hire and reject have their own calls below. */
export async function setApplicationStage(
  applicationId: string,
  stage: ApplicationStage,
  note?: string,
): Promise<Application> {
  return api.patch<Application>(`/employer/applications/${applicationId}/stage`, {
    stage,
    ...(note ? { note } : {}),
  });
}

/** Claims a vacancy on the job. Fails with `VACANCIES_FULL` if it was the last one. */
export async function hireApplicant(applicationId: string, note?: string): Promise<Application> {
  return api.post<Application>(`/employer/applications/${applicationId}/hire`, {
    ...(note ? { note } : {}),
  });
}

export async function rejectApplicant(
  applicationId: string,
  reason: string,
): Promise<Application> {
  return api.post<Application>(`/employer/applications/${applicationId}/reject`, { reason });
}

/** The row stays, so the employer sees the withdrawal and a re-apply reuses it. */
export async function withdrawApplication(
  applicationId: string,
  reason?: string,
): Promise<Application> {
  return api.request<Application>(`/me/applications/${applicationId}`, {
    method: 'DELETE',
    ...(reason ? { body: { reason } } : {}),
  }).then((result) => result.data);
}
