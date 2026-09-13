import {
  LocationLevel,
  type Category,
  type GeoLocation,
  type LocationNode,
  type SeedCity,
  type Skill,
} from '@rokdajob/shared';
import { ApiError } from '@/utils/api-error';
import { CategoryModel, toCategory, type CategoryDoc } from './category.model';
import { LocationModel, toLocationNode, type LocationDoc } from './location.model';
import { SkillModel, toSkill } from './skill.model';

/** Escapes user input before it becomes part of a regular expression. */
function literal(value: string): RegExp {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

export async function listCategories(): Promise<Category[]> {
  const categories = await CategoryModel.find({ isActive: true }).sort({ order: 1, name: 1 });

  // One grouped count rather than a query per category.
  const counts = await SkillModel.aggregate<{ _id: CategoryDoc['_id']; count: number }>([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const byCategory = new Map(counts.map((row) => [row._id.toString(), row.count]));

  return categories.map((doc) => toCategory(doc, byCategory.get(doc._id.toString()) ?? 0));
}

/**
 * Skills, optionally narrowed to one category and/or a search term.
 *
 * The term is matched against the name *and* the alias list, so "wireman" finds
 * Electrician — people search with the word they use on site, not ours.
 */
export async function listSkills(filters: {
  category?: string;
  q?: string;
}): Promise<Skill[]> {
  const query: Record<string, unknown> = { isActive: true };

  if (filters.category) {
    const category = await CategoryModel.findOne({ slug: filters.category, isActive: true });
    if (!category) throw ApiError.notFound('Category');
    query.category = category._id;
  }

  if (filters.q) {
    const pattern = literal(filters.q);
    query.$or = [{ name: pattern }, { slug: pattern }, { aliases: pattern }];
  }

  const skills = await SkillModel.find(query).sort({ demandScore: -1, name: 1 }).limit(200);

  const categoryIds = [...new Set(skills.map((skill) => skill.category.toString()))];
  const categories = await CategoryModel.find({ _id: { $in: categoryIds } });
  const byId = new Map(categories.map((doc) => [doc._id.toString(), doc]));

  return skills.flatMap((skill) => {
    const category = byId.get(skill.category.toString());
    // A skill whose category was removed is data we cannot render; skip rather than throw.
    return category ? [toSkill(skill, category)] : [];
  });
}

export async function listLocations(filters: {
  level?: LocationLevel;
  parent?: string;
  q?: string;
}): Promise<LocationNode[]> {
  const query: Record<string, unknown> = { isActive: true };

  if (filters.level) query.level = filters.level;

  if (filters.parent) {
    // The parent is named by slug; its level is whatever sits above the requested one.
    const parent = await LocationModel.findOne({ slug: filters.parent, isActive: true });
    if (!parent) throw ApiError.notFound('Parent location');
    query.parent = parent._id;
  }

  if (filters.q) query.name = literal(filters.q);

  const locations = await LocationModel.find(query).sort({ name: 1 }).limit(500);
  return locations.map(toLocationNode);
}

/** Walks a node's materialised path into the flat `GeoLocation` the forms use. */
async function toGeoLocation(node: LocationDoc): Promise<GeoLocation> {
  const ancestors = await LocationModel.find({ _id: { $in: node.path } });
  const byLevel = new Map(ancestors.map((doc) => [doc.level, doc]));
  if (node.level !== LocationLevel.LOCALITY) byLevel.set(node.level, node);

  const state = byLevel.get(LocationLevel.STATE);
  const district = byLevel.get(LocationLevel.DISTRICT);
  const city = byLevel.get(LocationLevel.CITY);

  if (!state || !district || !city) {
    throw ApiError.internal('This location is missing part of its hierarchy');
  }

  const isLocality = node.level === LocationLevel.LOCALITY;

  return {
    formatted: [isLocality ? node.name : undefined, city.name, state.name]
      .filter(Boolean)
      .join(', '),
    state: state.name,
    stateSlug: state.slug,
    district: district.name,
    districtSlug: district.slug,
    city: city.name,
    citySlug: city.slug,
    ...(isLocality ? { locality: node.name, localitySlug: node.slug } : {}),
    ...(node.pincodes[0] ? { pincode: node.pincodes[0] } : {}),
    geo: node.geo,
  };
}

/**
 * Turns a pincode into a full, form-ready location.
 *
 * This is what lets a worker type six digits during onboarding instead of picking a state,
 * then a district, then a city, then a locality.
 */
export async function resolvePincode(pincode: string): Promise<GeoLocation> {
  const node = await LocationModel.findOne({ pincodes: pincode, isActive: true });
  if (!node) throw ApiError.notFound(`Pincode ${pincode}`);
  return toGeoLocation(node);
}

/** Resolves a city or locality slug the same way, for the SEO landing pages. */
export async function resolvePlace(citySlug: string, localitySlug?: string): Promise<GeoLocation> {
  const slug = localitySlug ?? citySlug;
  const level = localitySlug ? LocationLevel.LOCALITY : LocationLevel.CITY;

  const node = await LocationModel.findOne({ level, slug, isActive: true });
  if (!node) throw ApiError.notFound('Location');
  return toGeoLocation(node);
}

/**
 * Cities composed back into the nested shape the front ends use for pickers.
 *
 * Built from four indexed reads rather than one request per city, and shaped like
 * `SeedCity` so a city dropdown does not have to walk the location tree itself.
 */
export async function listCities(): Promise<SeedCity[]> {
  const [states, districts, cities, localities] = await Promise.all([
    LocationModel.find({ level: LocationLevel.STATE, isActive: true }),
    LocationModel.find({ level: LocationLevel.DISTRICT, isActive: true }),
    LocationModel.find({ level: LocationLevel.CITY, isActive: true }).sort({ name: 1 }),
    LocationModel.find({ level: LocationLevel.LOCALITY, isActive: true }).sort({ name: 1 }),
  ]);

  const stateById = new Map(states.map((doc) => [doc._id.toString(), doc]));
  const districtById = new Map(districts.map((doc) => [doc._id.toString(), doc]));

  const localitiesByCity = new Map<string, LocationDoc[]>();
  for (const locality of localities) {
    const key = locality.parent?.toString();
    if (!key) continue;
    const bucket = localitiesByCity.get(key);
    if (bucket) bucket.push(locality);
    else localitiesByCity.set(key, [locality]);
  }

  return cities.flatMap((city) => {
    const district = city.parent ? districtById.get(city.parent.toString()) : undefined;
    const state = district?.parent ? stateById.get(district.parent.toString()) : undefined;
    // A city whose ancestors are missing cannot be rendered; skip rather than throw.
    if (!district || !state) return [];

    return [
      {
        name: city.name,
        slug: city.slug,
        district: district.name,
        districtSlug: district.slug,
        state: state.name,
        stateSlug: state.slug,
        coordinates: city.geo.coordinates,
        localities: (localitiesByCity.get(city._id.toString()) ?? []).map((locality) => ({
          name: locality.name,
          slug: locality.slug,
          pincodes: locality.pincodes,
          coordinates: locality.geo.coordinates,
        })),
      },
    ];
  });
}
