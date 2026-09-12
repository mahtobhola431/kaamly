import { ApplicationStage, Availability, JobStatus, SalaryType, Shift, Urgency } from '../enums';

export const BRAND = {
  name: 'Kaamly',
  tagline: 'Kaam bhi. Log bhi. Ek jagah.',
  subline: 'Find the right people for the work that needs to get done.',
  supportEmail: 'support@kaamly.com',
} as const;

export const LIMITS = {
  pageSizeDefault: 20,
  pageSizeMax: 50,
  searchRadiusDefaultKm: 15,
  searchRadiusMaxKm: 100,
  workRadiusMaxKm: 100,
  maxSkillsPerWorker: 10,
  maxWorkersPerJob: 500,
  maxUploadBytes: 5 * 1024 * 1024,
  jsonBodyLimit: '256kb',
  otpLength: 6,
  otpTtlSeconds: 5 * 60,
  otpMaxAttempts: 5,
  messageMaxLength: 2000,
  jobDescriptionMaxLength: 5000,
  bioMaxLength: 1000,
} as const;

export const ALLOWED_IMAGE_MIME: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];

export const ALLOWED_DOCUMENT_MIME: readonly string[] = [...ALLOWED_IMAGE_MIME, 'application/pdf'];

/* ------------------------------------------------------------------- labels */

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  PAUSED: 'Paused',
  HIRING: 'Hiring',
  FILLED: 'Filled',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
};

export const APPLICATION_STAGE_LABEL: Record<ApplicationStage, string> = {
  APPLIED: 'Applied',
  REVIEWED: 'Reviewed',
  SHORTLISTED: 'Shortlisted',
  CONTACTED: 'Contacted',
  INTERVIEW: 'Interview',
  SELECTED: 'Selected',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  AVAILABLE_NOW: 'Available now',
  AVAILABLE_FROM: 'Available from',
  BUSY: 'Currently working',
  NOT_LOOKING: 'Not looking',
};

export const SALARY_TYPE_LABEL: Record<SalaryType, string> = {
  PER_DAY: 'per day',
  PER_HOUR: 'per hour',
  PER_MONTH: 'per month',
  PER_PIECE: 'per piece',
};

export const SHIFT_LABEL: Record<Shift, string> = {
  DAY: 'Day shift',
  NIGHT: 'Night shift',
  ROTATIONAL: 'Rotational',
  FLEXIBLE: 'Flexible',
};

export const URGENCY_LABEL: Record<Urgency, string> = {
  NORMAL: 'Normal',
  URGENT: 'Urgent',
  IMMEDIATE: 'Immediate',
};

/**
 * Which stages an employer may move an application to from its current stage.
 * Enforced in the service layer so the board cannot produce impossible transitions.
 */
export const ALLOWED_STAGE_TRANSITIONS: Record<ApplicationStage, readonly ApplicationStage[]> = {
  APPLIED: ['REVIEWED', 'SHORTLISTED', 'REJECTED'],
  REVIEWED: ['SHORTLISTED', 'CONTACTED', 'REJECTED'],
  SHORTLISTED: ['CONTACTED', 'INTERVIEW', 'SELECTED', 'REJECTED'],
  CONTACTED: ['INTERVIEW', 'SELECTED', 'REJECTED'],
  INTERVIEW: ['SELECTED', 'REJECTED'],
  SELECTED: ['HIRED', 'REJECTED'],
  HIRED: [],
  REJECTED: ['APPLIED'],
  WITHDRAWN: [],
};
