import type {
  AdminLevel,
  ApprovalStatus,
  AuthProvider,
  ApplicationSource,
  ApplicationStage,
  Availability,
  CompanyType,
  ContactPreference,
  DocumentType,
  Gender,
  JobStatus,
  NotificationType,
  ReviewDirection,
  SalaryType,
  Shift,
  SkillLevel,
  Urgency,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '../enums';
import type { JsonRecord } from './api';

/** Every entity is serialised with a string `id`; `_id` never leaves the API. */
export interface Entity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ geography */

/** GeoJSON point. Coordinates are always [longitude, latitude]. */
export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface GeoLocation {
  formatted: string;
  state: string;
  stateSlug: string;
  district: string;
  districtSlug: string;
  city: string;
  citySlug: string;
  locality?: string;
  localitySlug?: string;
  pincode?: string;
  geo: GeoPoint;
}

export interface Wage {
  amount: number;
  type: SalaryType;
  negotiable: boolean;
}

/* -------------------------------------------------------------------- catalog */

export interface Category extends Entity {
  name: string;
  slug: string;
  icon: string;
  description?: string;
  order: number;
  isActive: boolean;
  skillCount?: number;
}

export interface Skill extends Entity {
  name: string;
  slug: string;
  /** Always populated on the wire; the API never returns a bare reference. */
  category: Category;
  aliases: string[];
  demandScore: number;
  isActive: boolean;
}

export interface LocationNode extends Entity {
  level: 'COUNTRY' | 'STATE' | 'DISTRICT' | 'CITY' | 'LOCALITY';
  name: string;
  slug: string;
  parent: string | null;
  pincodes: string[];
  geo: GeoPoint;
  isActive: boolean;
}

/* ----------------------------------------------------------------- identities */

export interface PublicUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  avatarUrl?: string;
  lastActiveAt?: string;
}

/** Admin decision on a contractor account, as the owner of the account sees it. */
export interface ApprovalState {
  status: ApprovalStatus;
  /** Why an admin rejected the account. Shown on the blocked screen. */
  reason?: string;
  decidedAt?: string;
}

export interface AuthUser extends PublicUser {
  email: string;
  phone?: string;
  status: UserStatus;
  phoneVerified: boolean;
  emailVerified: boolean;
  adminLevel?: AdminLevel;
  /** Every sign-in method linked to this account. Always contains at least one. */
  providers: AuthProvider[];
  approval: ApprovalState;
  /** False while a Google signup still has to choose employee or contractor. */
  registrationComplete: boolean;
  /** Present once the matching profile exists; drives onboarding redirects. */
  hasProfile: boolean;
  profileCompletion: number;
}

/** One row of the admin contractor-approval queue. */
export interface PendingApproval {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  companyName?: string;
  approval: ApprovalState;
  registeredAt: string;
}

export interface AuthTokens {
  accessToken: string;
  /** Seconds until the access token expires. Refresh token lives in an httpOnly cookie. */
  expiresIn: number;
}

export interface AuthSession {
  user: AuthUser;
  tokens: AuthTokens;
}

/* --------------------------------------------------------------------- worker */

export interface WorkerSkillRef {
  skill: Skill;
  years: number;
  level: SkillLevel;
}

export interface WorkerVerification {
  phone: boolean;
  profile: boolean;
  documents: boolean;
}

export interface WorkerProfile extends Entity {
  user: PublicUser;
  headline?: string;
  bio?: string;
  skills: WorkerSkillRef[];
  primaryCategory?: Category;
  experienceYears: number;
  location: GeoLocation;
  workRadiusKm: number;
  expectedWage: Wage;
  availability: Availability;
  availableFrom?: string;
  languages: string[];
  gender?: Gender;
  ratingAvg: number;
  ratingCount: number;
  completedJobs: number;
  verification: WorkerVerification;
  profileCompletion: number;
  /** Only present on geo search results. */
  distanceKm?: number;
  /** Revealed only after a contact relationship exists. */
  phone?: string;
}

/* ------------------------------------------------------------------- employer */

export interface Company extends Entity {
  name: string;
  slug: string;
  type: CompanyType;
  about?: string;
  logoUrl?: string;
  size?: string;
  foundedYear?: number;
  /** Absent until the contractor sets one — a company is created from a name alone. */
  location?: GeoLocation;
  /**
   * Only ever sent to the company's own owner (`/employer/*`). A job card carries
   * `Job['company']`, which is a `Pick` that leaves this out.
   */
  gstin?: string;
  verification: { company: boolean; gstin: boolean };
  ratingAvg: number;
  ratingCount: number;
  activeJobCount?: number;
}

export interface EmployerProfile extends Entity {
  user: PublicUser;
  company: Company;
  designation?: string;
}

/* ------------------------------------------------------------------------ job */

export interface Job extends Entity {
  title: string;
  slug: string;
  employer: PublicUser;
  company: Pick<Company, 'id' | 'name' | 'slug' | 'logoUrl' | 'type' | 'verification'>;
  category: Category;
  skills: Skill[];
  description: string;
  workersRequired: number;
  hiredCount: number;
  /** workersRequired - hiredCount, never negative. */
  vacanciesLeft: number;
  location: GeoLocation;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  shift: Shift;
  workingHours?: { from: string; to: string };
  salary: Wage;
  perks: { accommodation: boolean; food: boolean; transport: boolean };
  experienceRequiredYears: number;
  urgency: Urgency;
  contactPreference: ContactPreference;
  status: JobStatus;
  publishedAt?: string;
  expiresAt?: string;
  viewCount: number;
  applicationCount: number;
  /** Only present on geo search results. */
  distanceKm?: number;
  /** Viewer-specific flags, present when authenticated. */
  viewer?: { hasApplied: boolean; hasSaved?: boolean; applicationId?: string };
}

/* ---------------------------------------------------------------- application */

export interface ApplicationStageEvent {
  stage: ApplicationStage;
  at: string;
  by?: PublicUser;
  note?: string;
}

export interface Application extends Entity {
  job: Pick<Job, 'id' | 'title' | 'slug' | 'location' | 'salary' | 'status' | 'workersRequired'>;
  worker: PublicUser;
  workerProfile?: WorkerProfile;
  employer: PublicUser;
  stage: ApplicationStage;
  source: ApplicationSource;
  coverNote?: string;
  expectedWage?: Wage;
  stageHistory: ApplicationStageEvent[];
  rejectionReason?: string;
  hiredAt?: string;
  withdrawnAt?: string;
  /** The thread about this application, once either side has written a message. */
  conversationId?: string;
}

/* ----------------------------------------------------------------- messaging */

export interface Conversation extends Entity {
  participants: PublicUser[];
  job?: Pick<Job, 'id' | 'title' | 'slug'>;
  application?: string;
  lastMessage?: { text: string; at: string; by: string };
  unreadCount: number;
}

export interface Message extends Entity {
  conversation: string;
  sender: PublicUser;
  body: string;
  readBy: string[];
}

/* ------------------------------------------------------------- notifications */

export interface Notification extends Entity {
  type: NotificationType;
  title: string;
  body: string;
  data: JsonRecord;
  readAt: string | null;
}

/* ------------------------------------------------------------------- reviews */

export interface ReviewCategories {
  workQuality?: number;
  reliability?: number;
  communication?: number;
  punctuality?: number;
}

export interface Review extends Entity {
  job: Pick<Job, 'id' | 'title' | 'slug'>;
  author: PublicUser;
  subject: PublicUser;
  direction: ReviewDirection;
  rating: number;
  categories: ReviewCategories;
  comment?: string;
}

/* --------------------------------------------------------------------- teams */

export interface TeamMember extends Entity {
  worker: PublicUser;
  workerProfile?: Pick<WorkerProfile, 'id' | 'skills' | 'availability' | 'ratingAvg'>;
  roleLabel: string;
  joinedAt: string;
  leftAt?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'REMOVED';
}

export interface Team extends Entity {
  name: string;
  site?: GeoLocation;
  memberCount: number;
  members?: TeamMember[];
  activeJob?: Pick<Job, 'id' | 'title' | 'slug'>;
}

/* ----------------------------------------------------------------- documents */

export interface WorkerDocument extends Entity {
  type: DocumentType;
  url: string;
  status: VerificationStatus;
  note?: string;
}

/* ---------------------------------------------------------------- dashboards */

export interface EmployerDashboardStats {
  activeJobs: number;
  totalApplicants: number;
  shortlisted: number;
  hired: number;
  jobsCompleted: number;
  openPositions: number;
  hiringConversionRate: number;
  availableWorkersNearby: number;
}

export interface WorkerDashboardStats {
  nearbyJobs: number;
  recommendedJobs: number;
  activeApplications: number;
  shortlisted: number;
  unreadMessages: number;
  profileCompletion: number;
}

export interface AdminStats {
  totalUsers: number;
  activeWorkers: number;
  employers: number;
  jobs: number;
  applications: number;
  hires: number;
  completionRate: number;
  activeCities: number;
}
