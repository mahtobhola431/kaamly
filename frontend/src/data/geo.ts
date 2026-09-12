import { SEED_CITIES } from '@rokdajob/shared';
import type { GeoLocation, SeedCity, SeedLocality } from '@rokdajob/shared';

/**
 * Geography helpers for the demo dataset.
 *
 * `placeOf('mumbai', 'andheri-east')` builds the same `GeoLocation` shape the API will
 * return, including GeoJSON `[lng, lat]` ordering, so components never learn a temporary
 * data shape.
 */

export const cities = SEED_CITIES;

export const cityBySlug: Record<string, SeedCity> = Object.fromEntries(
  cities.map((city) => [city.slug, city]),
);

export function cityOf(slug: string): SeedCity {
  const city = cityBySlug[slug];
  if (!city) throw new Error(`Unknown city slug in demo data: ${slug}`);
  return city;
}

export function localityOf(citySlug: string, localitySlug: string): SeedLocality {
  const locality = cityOf(citySlug).localities.find((item) => item.slug === localitySlug);
  if (!locality) {
    throw new Error(`Unknown locality in demo data: ${citySlug}/${localitySlug}`);
  }
  return locality;
}

/** Builds a full `GeoLocation`; omit the locality to place something at the city centre. */
export function placeOf(citySlug: string, localitySlug?: string): GeoLocation {
  const city = cityOf(citySlug);
  const locality = localitySlug ? localityOf(citySlug, localitySlug) : undefined;
  const coordinates = locality?.coordinates ?? city.coordinates;

  return {
    formatted: locality
      ? `${locality.name}, ${city.name}, ${city.state}`
      : `${city.name}, ${city.state}`,
    state: city.state,
    stateSlug: city.stateSlug,
    district: city.district,
    districtSlug: city.districtSlug,
    city: city.name,
    citySlug: city.slug,
    ...(locality ? { locality: locality.name, localitySlug: locality.slug } : {}),
    ...(locality?.pincodes[0] ? { pincode: locality.pincodes[0] } : {}),
    geo: { type: 'Point', coordinates },
  };
}

const EARTH_RADIUS_KM = 6371;

/**
 * Great-circle distance, used only to make demo distances internally consistent.
 *
 * Production never does this in JavaScript — MongoDB `$geoNear` returns `distanceMeters`
 * from an indexed query (see docs/06-RISKS.md R1).
 */
export function distanceKm(a: [number, number], b: [number, number]): number {
  const toRad = (value: number): number => (value * Math.PI) / 180;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const km = 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
  return Math.round(km * 10) / 10;
}

/** Cities that have demo supply and demand, shown in the "popular locations" sections. */
export const featuredCities = cities.filter((city) =>
  [
    'mumbai',
    'thane',
    'navi-mumbai',
    'bhiwandi',
    'pune',
    'delhi',
    'bengaluru',
    'ahmedabad',
  ].includes(city.slug),
);
