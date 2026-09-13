import type { Types } from 'mongoose';
import { SEED_CATEGORIES, SEED_CITIES, LocationLevel } from '@rokdajob/shared';
import { logger } from '@/config/logger';
import { CategoryModel } from '@/modules/catalog/category.model';
import { LocationModel } from '@/modules/catalog/location.model';
import { SkillModel } from '@/modules/catalog/skill.model';

/**
 * Loads the shared taxonomy and launch geography into MongoDB.
 *
 * Every write is an idempotent upsert keyed on the slug, so running this on a populated
 * database refreshes names and coordinates without creating duplicates and without
 * disturbing rows an admin has since edited into existence.
 */

/** Demand weighting for the seeded skills; anything unlisted sits at the default. */
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

export interface SeedCounts {
  categories: number;
  skills: number;
  states: number;
  districts: number;
  cities: number;
  localities: number;
}

export async function seedCatalog(): Promise<SeedCounts> {
  const counts: SeedCounts = {
    categories: 0,
    skills: 0,
    states: 0,
    districts: 0,
    cities: 0,
    localities: 0,
  };

  /* ------------------------------------------------------ categories & skills */

  for (const [index, seed] of SEED_CATEGORIES.entries()) {
    const category = await CategoryModel.findOneAndUpdate(
      { slug: seed.slug },
      {
        $set: {
          name: seed.name,
          icon: seed.icon,
          description: seed.description,
          order: index,
          isActive: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    counts.categories += 1;

    for (const skill of seed.skills) {
      await SkillModel.updateOne(
        { slug: skill.slug },
        {
          $set: {
            name: skill.name,
            category: category._id,
            aliases: skill.aliases,
            demandScore: DEMAND[skill.slug] ?? 50,
            isActive: true,
          },
        },
        { upsert: true, setDefaultsOnInsert: true },
      );
      counts.skills += 1;
    }
  }

  /* ----------------------------------------------------------------- geography */

  /** Upserts one node and returns it, so the caller can use its id as the next parent. */
  async function upsertNode(input: {
    level: LocationLevel;
    name: string;
    slug: string;
    parent: Types.ObjectId | null;
    path: Types.ObjectId[];
    coordinates: [number, number];
    pincodes?: string[];
  }) {
    return LocationModel.findOneAndUpdate(
      { level: input.level, slug: input.slug },
      {
        $set: {
          name: input.name,
          parent: input.parent,
          path: input.path,
          geo: { type: 'Point' as const, coordinates: input.coordinates },
          ...(input.pincodes ? { pincodes: input.pincodes } : {}),
          isActive: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  // States and districts repeat across the city list, so each is created once.
  const stateIds = new Map<string, Types.ObjectId>();
  const districtIds = new Map<string, Types.ObjectId>();

  for (const city of SEED_CITIES) {
    let stateId = stateIds.get(city.stateSlug);
    if (!stateId) {
      const state = await upsertNode({
        level: LocationLevel.STATE,
        name: city.state,
        slug: city.stateSlug,
        parent: null,
        path: [],
        coordinates: city.coordinates,
      });
      stateId = state._id;
      stateIds.set(city.stateSlug, stateId);
      counts.states += 1;
    }

    let districtId = districtIds.get(city.districtSlug);
    if (!districtId) {
      const district = await upsertNode({
        level: LocationLevel.DISTRICT,
        name: city.district,
        slug: city.districtSlug,
        parent: stateId,
        path: [stateId],
        coordinates: city.coordinates,
      });
      districtId = district._id;
      districtIds.set(city.districtSlug, districtId);
      counts.districts += 1;
    }

    const cityNode = await upsertNode({
      level: LocationLevel.CITY,
      name: city.name,
      slug: city.slug,
      parent: districtId,
      path: [stateId, districtId],
      coordinates: city.coordinates,
    });
    counts.cities += 1;

    for (const locality of city.localities) {
      await upsertNode({
        level: LocationLevel.LOCALITY,
        name: locality.name,
        slug: locality.slug,
        parent: cityNode._id,
        path: [stateId, districtId, cityNode._id],
        coordinates: locality.coordinates,
        pincodes: locality.pincodes,
      });
      counts.localities += 1;
    }
  }

  logger.info(counts, 'Catalog seeded');
  return counts;
}
