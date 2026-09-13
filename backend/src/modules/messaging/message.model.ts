import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import { LIMITS } from '@rokdajob/shared';

/** `readBy` holds ids rather than a boolean, so a thread can grow past two people. */
export interface MessageDocument {
  _id: Types.ObjectId;
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  body: string;
  readBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export type MessageDoc = HydratedDocument<MessageDocument>;

const messageSchema = new Schema<MessageDocument>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, maxlength: LIMITS.messageMaxLength },
    readBy: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
  },
  { timestamps: true },
);

/** The only read path: newest-first within one thread. */
messageSchema.index({ conversation: 1, createdAt: -1 });

export const MessageModel = model<MessageDocument, Model<MessageDocument>>(
  'Message',
  messageSchema,
);
