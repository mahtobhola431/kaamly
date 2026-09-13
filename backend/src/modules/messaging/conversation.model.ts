import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';

/**
 * A thread between two people about a piece of work.
 *
 * `unread` is keyed by user id: both sides read the same document and each has its own
 * idea of what is new. `lastMessage` is denormalised so the inbox renders from this
 * collection alone rather than one lookup per thread.
 */
export interface ConversationDocument {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  job?: Types.ObjectId | null;
  application?: Types.ObjectId | null;
  lastMessage?: { text: string; at: Date; by: Types.ObjectId } | null;
  unread: Map<string, number>;
  /** Per-participant, so one side clearing a thread does not delete the other's. */
  hiddenFor: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export type ConversationDoc = HydratedDocument<ConversationDocument>;

const conversationSchema = new Schema<ConversationDocument>(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      required: true,
      validate: {
        validator: (value: Types.ObjectId[]) => value.length === 2,
        message: 'A conversation has exactly two participants',
      },
    },
    job: { type: Schema.Types.ObjectId, ref: 'Job', default: null },
    application: { type: Schema.Types.ObjectId, ref: 'Application', default: null },
    lastMessage: {
      type: new Schema(
        {
          text: { type: String, required: true, trim: true, maxlength: 2000 },
          at: { type: Date, required: true },
          by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        },
        { _id: false },
      ),
      default: null,
    },
    unread: { type: Map, of: Number, default: () => new Map<string, number>() },
    hiddenFor: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
  },
  { timestamps: true },
);

conversationSchema.index({ participants: 1, 'lastMessage.at': -1 });
/** One thread per pair per job, so "message employer" twice reopens rather than forks. */
conversationSchema.index({ participants: 1, job: 1 });
conversationSchema.index({ application: 1 });

export const ConversationModel = model<ConversationDocument, Model<ConversationDocument>>(
  'Conversation',
  conversationSchema,
);
