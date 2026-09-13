import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import type { Category } from '@rokdajob/shared';

/**
 * Work categories: the top level of the taxonomy ("Construction", "Warehouse").
 *
 * Seeded from `SEED_CATEGORIES` in @rokdajob/shared but owned by the database from then
 * on, so the admin panel can add or retire one without a deploy.
 */
export interface CategoryDocument {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  /** Lucide icon name, resolved on the client. */
  icon: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CategoryDoc = HydratedDocument<CategoryDocument>;

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    icon: { type: String, required: true, trim: true },
    description: { type: String, trim: true, maxlength: 300 },
    order: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ isActive: 1, order: 1 });

export const CategoryModel = model<CategoryDocument, Model<CategoryDocument>>(
  'Category',
  categorySchema,
);

/** Wire shape. `skillCount` is only present where the caller asked for it. */
export function toCategory(doc: CategoryDoc, skillCount?: number): Category {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    icon: doc.icon,
    ...(doc.description ? { description: doc.description } : {}),
    order: doc.order,
    isActive: doc.isActive,
    ...(skillCount === undefined ? {} : { skillCount }),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
