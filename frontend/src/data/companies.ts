import type { Company, EmployerProfile, PublicUser } from '@rokdajob/shared';
import { placeOf } from './geo';
import { daysAgo, hoursAgo } from './time';

/**
 * Demo employers. All names, companies and phone numbers are invented.
 * See docs/06-RISKS.md R10 — no real personal data appears anywhere in the dataset.
 */

interface CompanySeed {
  slug: string;
  name: string;
  type: Company['type'];
  about: string;
  size: string;
  foundedYear: number;
  city: string;
  locality?: string;
  verified: boolean;
  gstinVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  activeJobCount: number;
  contact: { name: string; designation: string };
}

const COMPANY_SEEDS: CompanySeed[] = [
  {
    slug: 'shreeji-infra-contractors',
    name: 'Shreeji Infra Contractors',
    type: 'CONTRACTOR',
    about:
      'Civil contracting firm running residential and commercial sites across Mumbai and Thane. On-site supervisors, weekly payouts, accommodation available for outstation crews.',
    size: '50-200 workers',
    foundedYear: 2011,
    city: 'mumbai',
    locality: 'andheri-east',
    verified: true,
    gstinVerified: true,
    ratingAvg: 4.6,
    ratingCount: 187,
    activeJobCount: 6,
    contact: { name: 'Nitin Deshmukh', designation: 'Project Manager' },
  },
  {
    slug: 'bluestar-warehousing',
    name: 'BlueStar Warehousing LLP',
    type: 'WAREHOUSE',
    about:
      'Third-party logistics operator with fulfilment centres in Bhiwandi and Taloja. Loading, packing, picking and forklift roles across day and night shifts.',
    size: '200-500 workers',
    foundedYear: 2016,
    city: 'bhiwandi',
    locality: 'kalher',
    verified: true,
    gstinVerified: true,
    ratingAvg: 4.4,
    ratingCount: 264,
    activeJobCount: 9,
    contact: { name: 'Farhan Qureshi', designation: 'Operations Head' },
  },
  {
    slug: 'aadhar-buildcon',
    name: 'Aadhar Buildcon Pvt Ltd',
    type: 'CONSTRUCTION',
    about:
      'Mid-rise residential developer executing four towers in Navi Mumbai and Panvel. Long-duration work for masons, bar benders and shuttering crews.',
    size: '200-500 workers',
    foundedYear: 2008,
    city: 'navi-mumbai',
    locality: 'panvel',
    verified: true,
    gstinVerified: true,
    ratingAvg: 4.5,
    ratingCount: 142,
    activeJobCount: 5,
    contact: { name: 'Sunita Rane', designation: 'HR Manager' },
  },
  {
    slug: 'precision-auto-components',
    name: 'Precision Auto Components',
    type: 'FACTORY',
    about:
      'Tier-2 auto component manufacturer at Chakan MIDC. Machine operators, fitters and maintenance technicians on rotational shifts with canteen and bus facility.',
    size: '500+ workers',
    foundedYear: 2004,
    city: 'pune',
    locality: 'chakan',
    verified: true,
    gstinVerified: true,
    ratingAvg: 4.3,
    ratingCount: 311,
    activeJobCount: 4,
    contact: { name: 'Rakesh Pawar', designation: 'Plant HR' },
  },
  {
    slug: 'urbanfix-services',
    name: 'UrbanFix Home Services',
    type: 'MAINTENANCE',
    about:
      'Appliance and home repair network covering Mumbai suburbs. Electricians, plumbers and AC technicians paid per job with fuel allowance.',
    size: '20-50 workers',
    foundedYear: 2019,
    city: 'mumbai',
    locality: 'goregaon',
    verified: true,
    gstinVerified: false,
    ratingAvg: 4.7,
    ratingCount: 98,
    activeJobCount: 3,
    contact: { name: 'Imran Shaikh', designation: 'Founder' },
  },
  {
    slug: 'greenleaf-facility',
    name: 'GreenLeaf Facility Management',
    type: 'PROPERTY',
    about:
      'Facility management for IT parks and gated societies in Thane and Navi Mumbai. Security guards, housekeeping and gardening staff on monthly salary.',
    size: '200-500 workers',
    foundedYear: 2013,
    city: 'thane',
    locality: 'wagle-estate',
    verified: false,
    gstinVerified: false,
    ratingAvg: 4.1,
    ratingCount: 76,
    activeJobCount: 4,
    contact: { name: 'Deepa Nair', designation: 'Client Servicing Lead' },
  },
];

const CREATED = daysAgo(300);

export const companies: Company[] = COMPANY_SEEDS.map((seed) => ({
  id: `cmp_${seed.slug}`,
  slug: seed.slug,
  name: seed.name,
  type: seed.type,
  about: seed.about,
  size: seed.size,
  foundedYear: seed.foundedYear,
  location: placeOf(seed.city, seed.locality),
  verification: { company: seed.verified, gstin: seed.gstinVerified },
  ratingAvg: seed.ratingAvg,
  ratingCount: seed.ratingCount,
  activeJobCount: seed.activeJobCount,
  createdAt: CREATED,
  updatedAt: daysAgo(3),
}));

export const companyBySlug: Record<string, Company> = Object.fromEntries(
  companies.map((company) => [company.slug, company]),
);

export function companyOf(slug: string): Company {
  const company = companyBySlug[slug];
  if (!company) throw new Error(`Unknown company slug in demo data: ${slug}`);
  return company;
}

/** The person who posts on behalf of each company. */
export const employers: EmployerProfile[] = COMPANY_SEEDS.map((seed, index) => {
  const user: PublicUser = {
    id: `usr_emp_${seed.slug}`,
    name: seed.contact.name,
    // Demo handles follow the same shape the real signup enforces: lowercase, dot separated.
    username: seed.slug.replace(/-/g, '.'),
    role: 'EMPLOYER',
    lastActiveAt: hoursAgo(index + 1),
  };
  return {
    id: `epr_${seed.slug}`,
    user,
    company: companyOf(seed.slug),
    designation: seed.contact.designation,
    createdAt: CREATED,
    updatedAt: daysAgo(5),
  };
});

export const employerByCompanySlug: Record<string, EmployerProfile> = Object.fromEntries(
  employers.map((employer) => [employer.company.slug, employer]),
);

/**
 * The employer whose CRM you are looking at when you open `/e`.
 * Signing in later replaces this with the authenticated employer.
 */
export const currentEmployer: EmployerProfile = employers[0] as EmployerProfile;
