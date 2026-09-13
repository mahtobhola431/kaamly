import { Schema } from 'mongoose';
import { SalaryType, type GeoLocation, type Wage } from '@rokdajob/shared';

/**
 * Embedded value objects shared by every locatable document.
 *
 * Defined once so a worker, a company and a job all store geography identically — the
 * `$geoNear` pipelines depend on `location.geo` having exactly this shape everywhere.
 */
export const geoPointSchema = new Schema(
  {
    type: { type: String, enum: ['Point'], required: true, default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  { _id: false },
);

export const geoLocationSchema = new Schema<GeoLocation>(
  {
    formatted: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    stateSlug: { type: String, required: true, trim: true, lowercase: true },
    district: { type: String, required: true, trim: true },
    districtSlug: { type: String, required: true, trim: true, lowercase: true },
    city: { type: String, required: true, trim: true },
    citySlug: { type: String, required: true, trim: true, lowercase: true },
    locality: { type: String, trim: true },
    localitySlug: { type: String, trim: true, lowercase: true },
    pincode: { type: String, trim: true },
    geo: { type: geoPointSchema, required: true },
  },
  { _id: false },
);

export const wageSchema = new Schema<Wage>(
  {
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: Object.values(SalaryType), required: true },
    negotiable: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);
