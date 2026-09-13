import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import { ApplicationSource, ApplicationStage, type Wage } from '@rokdajob/shared';
import { wageSchema } from '@/database/schemas/geo-location.schema';

/**
 * One worker's application to one job.
 *
 * `{job, worker}` is unique (docs/01-DATABASE.md §43), so a duplicate is caught by the
 * index rather than a read-then-write two requests could interleave through.
 *
 * `employer` is denormalised off the job so the pipeline board is one indexed query.
 */
export interface ApplicationStageEventDocument {
  stage: ApplicationStage;
  at: Date;
  by?: Types.ObjectId;
  note?: string;
}

export interface ApplicationDocument {
  _id: Types.ObjectId;
  job: Types.ObjectId;
  worker: Types.ObjectId;
  workerProfile?: Types.ObjectId | null;
  employer: Types.ObjectId;
  company: Types.ObjectId;
  stage: ApplicationStage;
  source: ApplicationSource;
  coverNote?: string;
  expectedWage?: Wage | null;
  stageHistory: ApplicationStageEventDocument[];
  rejectionReason?: string;
  hiredAt?: Date | null;
  withdrawnAt?: Date | null;
  /** Set the first time either side writes a message about this application. */
  conversation?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ApplicationDoc = HydratedDocument<ApplicationDocument>;

const stageEventSchema = new Schema<ApplicationStageEventDocument>(
  {
    stage: { type: String, enum: Object.values(ApplicationStage), required: true },
    at: { type: Date, required: true, default: Date.now },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const applicationSchema = new Schema<ApplicationDocument>(
  {
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    worker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    workerProfile: { type: Schema.Types.ObjectId, ref: 'WorkerProfile', default: null },
    employer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    stage: {
      type: String,
      enum: Object.values(ApplicationStage),
      required: true,
      default: ApplicationStage.APPLIED,
    },
    source: {
      type: String,
      enum: Object.values(ApplicationSource),
      required: true,
      default: ApplicationSource.APPLIED,
    },
    coverNote: { type: String, trim: true, maxlength: 1000 },
    expectedWage: { type: wageSchema, default: null },
    stageHistory: { type: [stageEventSchema], default: [] },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
    hiredAt: { type: Date, default: null },
    withdrawnAt: { type: Date, default: null },
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', default: null },
  },
  { timestamps: true },
);

/** The rule that makes applying idempotent (docs/06-RISKS.md R4). */
applicationSchema.index({ job: 1, worker: 1 }, { unique: true });
applicationSchema.index({ employer: 1, stage: 1, createdAt: -1 });
applicationSchema.index({ worker: 1, createdAt: -1 });
applicationSchema.index({ job: 1, stage: 1 });

export const ApplicationModel = model<ApplicationDocument, Model<ApplicationDocument>>(
  'Application',
  applicationSchema,
);

/** Stages at which the application is over, from either side. */
export const CLOSED_STAGES: readonly ApplicationStage[] = [
  ApplicationStage.REJECTED,
  ApplicationStage.WITHDRAWN,
];

/** True when a Mongo duplicate-key error came from the `{job, worker}` unique index. */
export function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
}
