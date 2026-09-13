/**
 * Every internal URL in one place.
 *
 * One structural note worth knowing: `/jobs/[city]` and `/jobs/[city]/[category]` are the
 * SEO landing pages, so a job detail page cannot also live at `/jobs/[slug]` — Next.js
 * cannot have two different dynamic segments at the same level. Job details therefore sit
 * under the static `post` segment, which always wins over the dynamic city segment.
 *
 * Worker profiles have the same shape for the same reason (`/workers/profile/[id]`), which
 * leaves `/workers/[city]/[skill]` free for SEO exactly as the spec asks.
 */
export const routes = {
  home: '/',

  // public discovery
  workers: '/workers',
  workersByCitySkill: (city: string, skill: string) => `/workers/${city}/${skill}`,
  workerProfile: (id: string) => `/workers/profile/${id}`,

  jobs: '/jobs',
  jobsByCity: (city: string) => `/jobs/${city}`,
  jobsByCityCategory: (city: string, category: string) => `/jobs/${city}/${category}`,
  job: (slug: string) => `/jobs/post/${slug}`,

  categories: '/categories',
  category: (slug: string) => `/categories/${slug}`,
  locations: '/locations',

  // marketing
  forEmployers: '/for-employers',
  forWorkers: '/for-workers',
  pricing: '/pricing',
  trustSafety: '/trust-safety',
  about: '/about',
  contact: '/contact',
  terms: '/legal/terms',
  privacy: '/legal/privacy',

  // auth
  chooseRole: '/auth/role',
  login: '/auth/login',
  register: (role?: 'worker' | 'employer') =>
    role ? `/auth/register?role=${role}` : '/auth/register',
  /** Where Google sends the browser back to; reads the token out of the URL fragment. */
  oauthCallback: '/auth/callback',
  /**
   * Sign in, then come back and finish what you started.
   *
   * `next` is where the user was and `intent` is what they were about to do, so the page
   * they return to can reopen the apply sheet rather than making them press it twice.
   */
  loginToContinue: (next: string, intent?: string) =>
    `/auth/login?${new URLSearchParams({ next, ...(intent ? { intent } : {}) }).toString()}`,
  registerToContinue: (role: 'worker' | 'employer', next: string, intent?: string) =>
    `/auth/register?${new URLSearchParams({
      role,
      next,
      ...(intent ? { intent } : {}),
    }).toString()}`,
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  /** Where a contractor waits while an admin reviews their account. */
  pending: '/auth/pending',

  // worker app
  w: {
    home: '/w',
    jobs: '/w/jobs',
    saved: '/w/jobs/saved',
    applications: '/w/applications',
    messages: '/w/messages',
    conversation: (id: string) => `/w/messages/${id}`,
    notifications: '/w/notifications',
    profile: '/w/profile',
    editProfile: '/w/profile/edit',
    skills: '/w/profile/skills',
    documents: '/w/profile/documents',
    reviews: '/w/reviews',
    workHistory: '/w/work-history',
    onboarding: '/w/onboarding',
  },

  // employer CRM
  e: {
    dashboard: '/e',
    jobs: '/e/jobs',
    newJob: '/e/jobs/new',
    job: (slug: string) => `/e/jobs/${slug}`,
    jobApplicants: (slug: string) => `/e/jobs/${slug}/applicants`,
    editJob: (slug: string) => `/e/jobs/${slug}/edit`,
    applicants: '/e/applicants',
    workers: '/e/workers',
    worker: (id: string) => `/e/workers/${id}`,
    teams: '/e/teams',
    team: (id: string) => `/e/teams/${id}`,
    messages: '/e/messages',
    conversation: (id: string) => `/e/messages/${id}`,
    activity: '/e/activity',
    analytics: '/e/analytics',
    company: '/e/company',
    settings: '/e/settings',
    onboarding: '/e/onboarding',
  },
} as const;
