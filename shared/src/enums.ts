/**
 * Domain vocabulary for rokdajob.
 *
 * Every enum is declared as a frozen `as const` object plus a derived union type, so the
 * same declaration serves runtime validation (zod, mongoose) and compile-time typing.
 */

// The `const` type parameter keeps the literal value types, so each derived union is
// `'WORKER' | 'EMPLOYER' | 'ADMIN'` rather than a widened `string`.
const asEnum = <const T extends Record<string, string>>(o: T): Readonly<T> => Object.freeze(o);

/* ------------------------------------------------------------------ identity */

export const UserRole = asEnum({
  WORKER: 'WORKER',
  EMPLOYER: 'EMPLOYER',
  ADMIN: 'ADMIN',
});
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = asEnum({
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED',
});
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

/** How a user proves who they are. A single account may carry more than one. */
export const AuthProvider = asEnum({
  LOCAL: 'LOCAL',
  GOOGLE: 'GOOGLE',
});
export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];

/**
 * Admin gate on an account. Workers ("employees") are usable the moment they register;
 * employers ("contractors") sit at PENDING until an admin approves them, because they are
 * the side that posts jobs and reaches out to workers.
 */
export const ApprovalStatus = asEnum({
  /** Role needs no review — set on workers and admins at registration. */
  AUTO_APPROVED: 'AUTO_APPROVED',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
});
export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

/** Roles whose registration must be reviewed by an admin before the account can act. */
export const ROLES_REQUIRING_APPROVAL: readonly UserRole[] = [UserRole.EMPLOYER];

/** Approval states that let a user act on the product. */
export const ACTIVE_APPROVAL_STATUSES: readonly ApprovalStatus[] = [
  ApprovalStatus.AUTO_APPROVED,
  ApprovalStatus.APPROVED,
];

export const AdminLevel = asEnum({
  SUPPORT: 'SUPPORT',
  MODERATOR: 'MODERATOR',
  SUPER: 'SUPER',
});
export type AdminLevel = (typeof AdminLevel)[keyof typeof AdminLevel];

export const OtpPurpose = asEnum({
  SIGNUP: 'SIGNUP',
  LOGIN: 'LOGIN',
  PHONE_VERIFY: 'PHONE_VERIFY',
  PASSWORD_RESET: 'PASSWORD_RESET',
});
export type OtpPurpose = (typeof OtpPurpose)[keyof typeof OtpPurpose];

/* ------------------------------------------------------------------- worker */

export const Availability = asEnum({
  AVAILABLE_NOW: 'AVAILABLE_NOW',
  AVAILABLE_FROM: 'AVAILABLE_FROM',
  BUSY: 'BUSY',
  NOT_LOOKING: 'NOT_LOOKING',
});
export type Availability = (typeof Availability)[keyof typeof Availability];

export const SkillLevel = asEnum({
  BEGINNER: 'BEGINNER',
  SKILLED: 'SKILLED',
  EXPERT: 'EXPERT',
});
export type SkillLevel = (typeof SkillLevel)[keyof typeof SkillLevel];

export const Gender = asEnum({
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
});
export type Gender = (typeof Gender)[keyof typeof Gender];

/* ----------------------------------------------------------------- employer */

export const CompanyType = asEnum({
  CONTRACTOR: 'CONTRACTOR',
  CONSTRUCTION: 'CONSTRUCTION',
  WAREHOUSE: 'WAREHOUSE',
  FACTORY: 'FACTORY',
  MAINTENANCE: 'MAINTENANCE',
  SMALL_BUSINESS: 'SMALL_BUSINESS',
  PROPERTY: 'PROPERTY',
  SERVICE_PROVIDER: 'SERVICE_PROVIDER',
  OTHER: 'OTHER',
});
export type CompanyType = (typeof CompanyType)[keyof typeof CompanyType];

/* ---------------------------------------------------------------------- job */

export const JobStatus = asEnum({
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  PAUSED: 'PAUSED',
  HIRING: 'HIRING',
  FILLED: 'FILLED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
});
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

/** Statuses at which a job is visible in public search and accepts applications. */
export const OPEN_JOB_STATUSES: readonly JobStatus[] = [JobStatus.PUBLISHED, JobStatus.HIRING];

export const SalaryType = asEnum({
  PER_DAY: 'PER_DAY',
  PER_HOUR: 'PER_HOUR',
  PER_MONTH: 'PER_MONTH',
  PER_PIECE: 'PER_PIECE',
});
export type SalaryType = (typeof SalaryType)[keyof typeof SalaryType];

export const Shift = asEnum({
  DAY: 'DAY',
  NIGHT: 'NIGHT',
  ROTATIONAL: 'ROTATIONAL',
  FLEXIBLE: 'FLEXIBLE',
});
export type Shift = (typeof Shift)[keyof typeof Shift];

export const Urgency = asEnum({
  NORMAL: 'NORMAL',
  URGENT: 'URGENT',
  IMMEDIATE: 'IMMEDIATE',
});
export type Urgency = (typeof Urgency)[keyof typeof Urgency];

export const ContactPreference = asEnum({
  IN_APP: 'IN_APP',
  PHONE: 'PHONE',
  BOTH: 'BOTH',
});
export type ContactPreference = (typeof ContactPreference)[keyof typeof ContactPreference];

/* -------------------------------------------------------------- application */

export const ApplicationStage = asEnum({
  APPLIED: 'APPLIED',
  REVIEWED: 'REVIEWED',
  SHORTLISTED: 'SHORTLISTED',
  CONTACTED: 'CONTACTED',
  INTERVIEW: 'INTERVIEW',
  SELECTED: 'SELECTED',
  HIRED: 'HIRED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
});
export type ApplicationStage = (typeof ApplicationStage)[keyof typeof ApplicationStage];

/** Left-to-right column order of the employer pipeline board. */
export const PIPELINE_STAGES: readonly ApplicationStage[] = [
  ApplicationStage.APPLIED,
  ApplicationStage.REVIEWED,
  ApplicationStage.SHORTLISTED,
  ApplicationStage.CONTACTED,
  ApplicationStage.INTERVIEW,
  ApplicationStage.SELECTED,
  ApplicationStage.HIRED,
  ApplicationStage.REJECTED,
];

export const ApplicationSource = asEnum({
  APPLIED: 'APPLIED',
  INVITED: 'INVITED',
});
export type ApplicationSource = (typeof ApplicationSource)[keyof typeof ApplicationSource];

/* ------------------------------------------------------------- notification */

export const NotificationType = asEnum({
  JOB_NEARBY: 'JOB_NEARBY',
  APPLICATION_RECEIVED: 'APPLICATION_RECEIVED',
  APPLICATION_SHORTLISTED: 'APPLICATION_SHORTLISTED',
  APPLICATION_REJECTED: 'APPLICATION_REJECTED',
  WORKER_INVITED: 'WORKER_INVITED',
  WORKER_ACCEPTED: 'WORKER_ACCEPTED',
  WORKER_HIRED: 'WORKER_HIRED',
  JOB_STATUS_CHANGED: 'JOB_STATUS_CHANGED',
  NEW_MESSAGE: 'NEW_MESSAGE',
  PROFILE_VERIFIED: 'PROFILE_VERIFIED',
  DOCUMENT_REVIEWED: 'DOCUMENT_REVIEWED',
  REVIEW_RECEIVED: 'REVIEW_RECEIVED',
  REMINDER: 'REMINDER',
});
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

/* ------------------------------------------------------------------- others */

export const DocumentType = asEnum({
  AADHAAR: 'AADHAAR',
  PAN: 'PAN',
  DRIVING_LICENSE: 'DRIVING_LICENSE',
  SKILL_CERTIFICATE: 'SKILL_CERTIFICATE',
  OTHER: 'OTHER',
});
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const VerificationStatus = asEnum({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
});
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const ReviewDirection = asEnum({
  EMPLOYER_TO_WORKER: 'EMPLOYER_TO_WORKER',
  WORKER_TO_EMPLOYER: 'WORKER_TO_EMPLOYER',
});
export type ReviewDirection = (typeof ReviewDirection)[keyof typeof ReviewDirection];

export const LocationLevel = asEnum({
  COUNTRY: 'COUNTRY',
  STATE: 'STATE',
  DISTRICT: 'DISTRICT',
  CITY: 'CITY',
  LOCALITY: 'LOCALITY',
});
export type LocationLevel = (typeof LocationLevel)[keyof typeof LocationLevel];

export const TeamMemberStatus = asEnum({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  REMOVED: 'REMOVED',
});
export type TeamMemberStatus = (typeof TeamMemberStatus)[keyof typeof TeamMemberStatus];

export const ReportStatus = asEnum({
  OPEN: 'OPEN',
  REVIEWING: 'REVIEWING',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED',
});
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

/* -------------------------------------------------------------- error codes */

export const ApiErrorCode = asEnum({
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  FORBIDDEN: 'FORBIDDEN',
  ACCOUNT_PENDING_APPROVAL: 'ACCOUNT_PENDING_APPROVAL',
  ACCOUNT_REJECTED: 'ACCOUNT_REJECTED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  OAUTH_FAILED: 'OAUTH_FAILED',
  PASSWORD_NOT_SET: 'PASSWORD_NOT_SET',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  DUPLICATE_APPLICATION: 'DUPLICATE_APPLICATION',
  JOB_NOT_OPEN: 'JOB_NOT_OPEN',
  VACANCIES_FULL: 'VACANCIES_FULL',
  ALREADY_REVIEWED: 'ALREADY_REVIEWED',
  PROFILE_INCOMPLETE: 'PROFILE_INCOMPLETE',
  OTP_INVALID: 'OTP_INVALID',
  OTP_EXPIRED: 'OTP_EXPIRED',
  RATE_LIMITED: 'RATE_LIMITED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA: 'UNSUPPORTED_MEDIA',
  INTERNAL: 'INTERNAL',
});
export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];
