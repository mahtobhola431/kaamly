import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import { LocationLevel, type GeoPoint, type LocationNode } from '@rokdajob/shared';

/**
 * The geography master: one document per state, district, city and locality.
 *
 * Stored as a tree with a materialised `path` of ancestor ids, so "everything under
 * Maharashtra" is a single indexed query rather than a recursive walk. The collection is
 * import-shaped, so a full India pincode dataset loads later without code changes
 * (docs/06-RISKS.md R2).
 */
export interface LocationDocument {
  _id: Types.ObjectId;
  level: LocationLevel;
  name: string;
  slug: string;
  parent: Types.ObjectId | null;
  /** Ancestors, root first. Excludes this node. */
  path: Types.ObjectId[];
  pincodes: string[];
  geo: GeoPoint;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type LocationDoc = HydratedDocument<LocationDocument>;

const locationSchema = new Schema<LocationDocument>(
  {
    level: { type: String, enum: Object.values(LocationLevel), required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    parent: { type: Schema.Types.ObjectId, ref: 'Location', default: null },
    path: { type: [Schema.Types.ObjectId], default: [] },
    pincodes: { type: [String], default: [] },
    geo: {
      type: { type: String, enum: ['Point'], required: true, default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

// A slug is only unique within its level: "mumbai" is both a district and a city.
locationSchema.index({ level: 1, slug: 1 }, { unique: true });
locationSchema.index({ parent: 1 });
locationSchema.index({ pincodes: 1 });
locationSchema.index({ path: 1 });
locationSchema.index({ geo: '2dsphere' });
locationSchema.index({ name: 'text' });

export const LocationModel = model<LocationDocument, Model<LocationDocument>>(
  'Location',
  locationSchema,
);

export function toLocationNode(doc: LocationDoc): LocationNode {
  return {
    id: doc._id.toString(),
    level: doc.level,
    name: doc.name,
    slug: doc.slug,
    parent: doc.parent ? doc.parent.toString() : null,
    pincodes: doc.pincodes,
    geo: doc.geo,
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
