import type { Category, SeedCity, Skill } from '@rokdajob/shared';
import { api } from '@/lib/api/client';
import { buildFallback } from '@/lib/data/prerender';

/**
 * Taxonomy and geography, served by `GET /catalog/*`.
 *
 * Reference data changes rarely, so every read is cached by Next for an hour and tagged
 * `catalog` — a future admin edit can invalidate the whole set with one
 * `revalidateTag('catalog')` rather than waiting for each page to expire.
 */
const CACHE = { next: { revalidate: 3600, tags: ['catalog'] } };

export async function getCategories(): Promise<Category[]> {
  return buildFallback(
    'the category list',
    () => api.get<Category[]>('/catalog/categories', CACHE),
    [],
  );
}

export async function getCategory(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((category) => category.slug === slug) ?? null;
}

export async function getSkills(categorySlug?: string): Promise<Skill[]> {
  return buildFallback(
    'the skill list',
    () =>
      api.get<Skill[]>('/catalog/skills', {
        ...CACHE,
        ...(categorySlug ? { query: { category: categorySlug } } : {}),
      }),
    [],
  );
}

export async function getSkill(slug: string): Promise<Skill | null> {
  const skills = await getSkills();
  return skills.find((skill) => skill.slug === slug) ?? null;
}

/** Highest demand first — the API already sorts on `demandScore`. */
export async function getPopularSkills(take = 12): Promise<Skill[]> {
  const skills = await getSkills();
  return skills.slice(0, take);
}

export async function getCities(): Promise<readonly SeedCity[]> {
  return buildFallback('the city list', () => api.get<SeedCity[]>('/catalog/cities', CACHE), []);
}

export async function getCity(slug: string): Promise<SeedCity | null> {
  const cities = await getCities();
  return cities.find((city) => city.slug === slug) ?? null;
}

/** Cities with enough localities to make a landing page worth rendering. */
export async function getFeaturedCities(take = 8): Promise<readonly SeedCity[]> {
  const cities = await getCities();
  return [...cities].sort((a, b) => b.localities.length - a.localities.length).slice(0, take);
}

/**
 * Resolves a skill slug that may be a plural SEO segment, e.g. `electricians`.
 *
 * The trailing "s" is only dropped when the exact slug misses, so a genuine slug ending
 * in "s" is never mangled.
 */
export async function resolveSkillSlug(segment: string): Promise<Skill | null> {
  const skills = await getSkills();
  const direct = skills.find((skill) => skill.slug === segment);
  if (direct) return direct;

  const singular = segment.replace(/s$/, '');
  return skills.find((skill) => skill.slug === singular) ?? null;
}
