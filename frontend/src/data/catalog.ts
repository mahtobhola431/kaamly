import { SEED_CATEGORIES } from '@rokdajob/shared';
import type { Category, Skill } from '@rokdajob/shared';
import { daysAgo } from './time';

/**
 * Categories and skills, expanded from the shared seed taxonomy into full domain objects.
 *
 * The backend will serve exactly this shape from `GET /catalog/categories` and
 * `GET /catalog/skills`, so swapping the data source later is a one-line change in
 * `src/lib/data/catalog.ts`.
 */

const CREATED = daysAgo(400);

/** Rough demand weighting, used to order category tiles and the "in demand" chips. */
const DEMAND: Record<string, number> = {
  'construction-helper': 98,
  mason: 95,
  electrician: 92,
  plumber: 88,
  'warehouse-worker': 86,
  driver: 84,
  helper: 82,
  carpenter: 78,
  painter: 76,
  welder: 74,
  loader: 72,
  'security-guard': 70,
  'ac-technician': 68,
  cleaner: 66,
  'forklift-operator': 60,
  'site-supervisor': 58,
  fitter: 55,
};

export const categories: Category[] = SEED_CATEGORIES.map((seed, index) => ({
  id: `cat_${seed.slug}`,
  slug: seed.slug,
  name: seed.name,
  icon: seed.icon,
  description: seed.description,
  order: index + 1,
  isActive: true,
  skillCount: seed.skills.length,
  createdAt: CREATED,
  updatedAt: CREATED,
}));

export const categoryBySlug: Record<string, Category> = Object.fromEntries(
  categories.map((category) => [category.slug, category]),
);

export const skills: Skill[] = SEED_CATEGORIES.flatMap((seedCategory) =>
  seedCategory.skills.map((seedSkill) => ({
    id: `skl_${seedSkill.slug}`,
    slug: seedSkill.slug,
    name: seedSkill.name,
    aliases: [...seedSkill.aliases],
    category: categoryBySlug[seedCategory.slug] as Category,
    demandScore: DEMAND[seedSkill.slug] ?? 40,
    isActive: true,
    createdAt: CREATED,
    updatedAt: CREATED,
  })),
);

export const skillBySlug: Record<string, Skill> = Object.fromEntries(
  skills.map((skill) => [skill.slug, skill]),
);

/** Throws on an unknown slug so a typo in demo data fails loudly at module load. */
export function skillOf(slug: string): Skill {
  const skill = skillBySlug[slug];
  if (!skill) throw new Error(`Unknown skill slug in demo data: ${slug}`);
  return skill;
}

export function categoryOf(slug: string): Category {
  const category = categoryBySlug[slug];
  if (!category) throw new Error(`Unknown category slug in demo data: ${slug}`);
  return category;
}

/** Highest-demand skills first — drives the landing page chips and empty-state hints. */
export const popularSkills: Skill[] = [...skills]
  .sort((a, b) => b.demandScore - a.demandScore)
  .slice(0, 12);
