import type { Category, SeedCity, Skill } from '@rokdajob/shared';
import { categories, popularSkills, skills } from '@/data/catalog';
import { cityBySlug, cities, featuredCities } from '@/data/geo';

/** Taxonomy reads. Replace the bodies with `GET /catalog/*` when the API is live. */

export async function getCategories(): Promise<Category[]> {
  return categories;
}

export async function getCategory(slug: string): Promise<Category | null> {
  return categories.find((category) => category.slug === slug) ?? null;
}

export async function getSkills(categorySlug?: string): Promise<Skill[]> {
  if (!categorySlug) return skills;
  return skills.filter((skill) => skill.category.slug === categorySlug);
}

export async function getSkill(slug: string): Promise<Skill | null> {
  return skills.find((skill) => skill.slug === slug) ?? null;
}

export async function getPopularSkills(): Promise<Skill[]> {
  return popularSkills;
}

export async function getCities(): Promise<readonly SeedCity[]> {
  return cities;
}

export async function getFeaturedCities(): Promise<readonly SeedCity[]> {
  return featuredCities;
}

export async function getCity(slug: string): Promise<SeedCity | null> {
  return cityBySlug[slug] ?? null;
}

/** Resolves a skill slug that may be a plural SEO segment, e.g. `electricians`. */
export async function resolveSkillSlug(segment: string): Promise<Skill | null> {
  const direct = skills.find((skill) => skill.slug === segment);
  if (direct) return direct;
  const singular = segment.replace(/s$/, '');
  return skills.find((skill) => skill.slug === singular) ?? null;
}
