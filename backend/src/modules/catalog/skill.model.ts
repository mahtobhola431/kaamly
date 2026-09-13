import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import type { Skill } from '@rokdajob/shared';
import { toCategory, type CategoryDoc } from './category.model';

/**
 * A concrete trade inside a category.
 *
 * `aliases` carry the words people actually type or say — "wireman" for Electrician,
 * "mistri" for Mason — so search finds a skill without the user knowing our vocabulary.
 */
export interface SkillDocument {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  category: Types.ObjectId;
  aliases: string[];
  /** Rough demand weighting, used to order chips and "in demand" lists. */
  demandScore: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type SkillDoc = HydratedDocument<SkillDocument>;

const skillSchema = new Schema<SkillDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    aliases: { type: [String], default: [] },
    demandScore: { type: Number, required: true, default: 50 },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

skillSchema.index({ slug: 1 }, { unique: true });
skillSchema.index({ category: 1, isActive: 1 });
skillSchema.index({ aliases: 1 });
skillSchema.index({ demandScore: -1 });

export const SkillModel = model<SkillDocument, Model<SkillDocument>>('Skill', skillSchema);

/**
 * Wire shape. The API never returns a bare category reference — `Skill.category` is
 * always a populated `Category` — so the caller must hand in the loaded document.
 */
export function toSkill(doc: SkillDoc, category: CategoryDoc): Skill {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    category: toCategory(category),
    aliases: doc.aliases,
    demandScore: doc.demandScore,
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
