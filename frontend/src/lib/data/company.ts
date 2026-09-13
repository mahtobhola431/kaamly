import type { Company, EmployerProfile, UpdateCompanyInput } from '@rokdajob/shared';
import { api } from '@/lib/api/client';

/** The contractor's own company and profile, served by `/employer`. Browser-only. */

export async function getMyCompany(): Promise<Company> {
  return api.get<Company>('/employer/company');
}

export async function getMyEmployerProfile(): Promise<EmployerProfile> {
  return api.get<EmployerProfile>('/employer/me');
}

export async function updateMyCompany(input: UpdateCompanyInput): Promise<Company> {
  return api.patch<Company>('/employer/company', input);
}

/**
 * The client leaves `Content-Type` off a FormData body on purpose, so the browser can add
 * the multipart boundary only it knows.
 */
export async function uploadCompanyLogo(file: File): Promise<Company> {
  const body = new FormData();
  body.append('file', file);
  return api.post<Company>('/employer/company/logo', body);
}

export interface EmployerDashboard {
  company: Company;
  jobs: { open: number; draft: number; filled: number; total: number };
  applications: { total: number; newThisWeek: number; shortlisted: number; hired: number };
  workersRequired: number;
  hiredCount: number;
}

export async function getEmployerDashboard(): Promise<EmployerDashboard> {
  return api.get<EmployerDashboard>('/employer/dashboard');
}
