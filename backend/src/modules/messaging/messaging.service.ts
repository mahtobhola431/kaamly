import mongoose from 'mongoose';
import {
  UserRole,
  type Conversation,
  type ConversationQueryInput,
  type Message,
  type MessageQueryInput,
  type StartConversationInput,
} from '@rokdajob/shared';
import { ApiError } from '@/utils/api-error';
import { User, type UserDoc } from '@/modules/auth/user.model';
import { ApplicationModel } from '@/modules/applications/application.model';
import { JobModel } from '@/modules/jobs/job.model';
import { ConversationModel, type ConversationDoc } from './conversation.model';
import { MessageModel, type MessageDoc } from './message.model';

/**
 * Messaging between a worker and a contractor.
 *
 *   1. A thread is always about a job or an application — no cold DMs.
 *   2. One thread per pair per job, so writing twice reopens rather than forks.
 */

type ParticipantMap = Map<string, UserDoc>;

async function loadParticipants(conversations: ConversationDoc[]): Promise<ParticipantMap> {
  const ids = [...new Set(conversations.flatMap((c) => c.participants.map(String)))];
  const users = await User.find({ _id: { $in: ids } });
  return new Map(users.map((user) => [user._id.toString(), user]));
}

function hydrate(
  conversation: ConversationDoc,
  viewerId: string,
  participants: ParticipantMap,
  jobById: Map<string, { id: string; title: string; slug: string }>,
): Conversation {
  const people = conversation.participants
    .map((id) => participants.get(id.toString()))
    .filter((user): user is UserDoc => Boolean(user));

  const job = conversation.job ? jobById.get(conversation.job.toString()) : undefined;

  return {
    id: conversation._id.toString(),
    participants: people.map((user) => user.toPublicUser()),
    ...(job ? { job } : {}),
    ...(conversation.application ? { application: conversation.application.toString() } : {}),
    ...(conversation.lastMessage
      ? {
          lastMessage: {
            text: conversation.lastMessage.text,
            at: conversation.lastMessage.at.toISOString(),
            by: conversation.lastMessage.by.toString(),
          },
        }
      : {}),
    unreadCount: conversation.unread.get(viewerId) ?? 0,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
  };
}

async function hydrateMany(
  conversations: ConversationDoc[],
  viewerId: string,
): Promise<Conversation[]> {
  if (conversations.length === 0) return [];

  const jobIds = conversations.flatMap((c) => (c.job ? [c.job] : []));
  const [participants, jobs] = await Promise.all([
    loadParticipants(conversations),
    JobModel.find({ _id: { $in: jobIds } }, { title: 1, slug: 1 }),
  ]);

  const jobById = new Map(
    jobs.map((job) => [
      job._id.toString(),
      { id: job._id.toString(), title: job.title, slug: job.slug },
    ]),
  );

  return conversations.map((conversation) =>
    hydrate(conversation, viewerId, participants, jobById),
  );
}

function toMessage(message: MessageDoc, sender: UserDoc): Message {
  return {
    id: message._id.toString(),
    conversation: message.conversation.toString(),
    sender: sender.toPublicUser(),
    body: message.body,
    readBy: message.readBy.map(String),
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
  };
}

/** Loads a conversation the caller is actually in, or refuses. */
async function participantConversation(
  userId: string,
  conversationId: string,
): Promise<ConversationDoc> {
  const conversation = await ConversationModel.findById(conversationId);
  if (!conversation) throw ApiError.notFound('Conversation');
  if (!conversation.participants.some((id) => id.toString() === userId)) {
    throw ApiError.forbidden('This conversation is not yours');
  }
  return conversation;
}

/* --------------------------------------------------------------------- writes */

/** The thread for this pair and job, created if absent. */
export async function findOrCreateConversation(options: {
  participants: [string, string];
  job?: string | null;
  application?: string | null;
}): Promise<ConversationDoc> {
  const participants = options.participants.map((id) => new mongoose.Types.ObjectId(id));
  const job = options.job ? new mongoose.Types.ObjectId(options.job) : null;

  const existing = await ConversationModel.findOne({
    participants: { $all: participants, $size: 2 },
    job,
  });
  if (existing) {
    // Using a thread again unhides it.
    if (existing.hiddenFor.length > 0) {
      existing.hiddenFor = [];
      await existing.save();
    }
    return existing;
  }

  return ConversationModel.create({
    participants,
    job,
    application: options.application ? new mongoose.Types.ObjectId(options.application) : null,
    unread: new Map(participants.map((id) => [id.toString(), 0])),
  });
}

/**
 * Appends a message and bumps both inboxes. Unread uses `$inc` rather than
 * read-modify-write, so two messages arriving at once cannot lose a count.
 */
export async function postMessage(
  conversation: ConversationDoc,
  senderId: string,
  body: string,
): Promise<Message> {
  const sender = await User.findOne({ _id: senderId, deletedAt: null });
  if (!sender) throw ApiError.unauthenticated('Your account is no longer available');

  const message = await MessageModel.create({
    conversation: conversation._id,
    sender: sender._id,
    body,
    readBy: [sender._id],
  });

  const increments: Record<string, number> = {};
  for (const participant of conversation.participants) {
    const id = participant.toString();
    if (id !== senderId) increments[`unread.${id}`] = 1;
  }

  await ConversationModel.updateOne(
    { _id: conversation._id },
    {
      $set: {
        lastMessage: { text: message.body, at: message.createdAt, by: sender._id },
        [`unread.${senderId}`]: 0,
        hiddenFor: [],
      },
      ...(Object.keys(increments).length > 0 ? { $inc: increments } : {}),
    },
  );

  return toMessage(message, sender);
}

/**
 * Opens or reopens a thread and posts the first message. The counterpart is derived from
 * an application, a job or an explicit recipient, so a job page needs only the job id.
 */
export async function startConversation(
  userId: string,
  role: UserRole,
  input: StartConversationInput,
): Promise<{ conversation: Conversation; message: Message }> {
  let recipientId = input.recipient;
  let jobId = input.job ?? null;
  let applicationId = input.application ?? null;

  if (applicationId) {
    const application = await ApplicationModel.findById(applicationId);
    if (!application) throw ApiError.notFound('Application');

    const worker = application.worker.toString();
    const employer = application.employer.toString();
    if (userId !== worker && userId !== employer) {
      throw ApiError.forbidden('This application is not yours');
    }

    recipientId = userId === worker ? employer : worker;
    jobId = application.job.toString();
  } else if (!recipientId && jobId) {
    // Writing from a job page: the counterpart is whoever posted it.
    const job = await JobModel.findOne({ _id: jobId, deletedAt: null });
    if (!job) throw ApiError.notFound('Job');
    recipientId = job.employer.toString();

    // If the worker already applied, keep the thread attached to that application.
    const application = await ApplicationModel.findOne({ job: job._id, worker: userId });
    if (application) applicationId = application._id.toString();
  }

  if (!recipientId) throw ApiError.badRequest('Say who this message is for');
  if (recipientId === userId) throw ApiError.badRequest('You cannot message yourself');

  // No job and no application behind it is a cold approach; only a contractor may make one.
  if (!jobId && !applicationId && role !== UserRole.EMPLOYER) {
    throw ApiError.badRequest('Start the conversation from the job you are writing about');
  }

  const recipient = await User.findOne({ _id: recipientId, deletedAt: null });
  if (!recipient) throw ApiError.notFound('That account');

  // Workers and contractors talk to each other, not among themselves.
  if (recipient.role === role) {
    throw ApiError.forbidden('You can only message the other side of a job');
  }
  if (recipient.role === UserRole.ADMIN) {
    throw ApiError.forbidden('Admin accounts cannot be messaged');
  }

  const conversation = await findOrCreateConversation({
    participants: [userId, recipientId],
    job: jobId,
    application: applicationId,
  });

  // A thread that started before the application existed picks it up now.
  if (applicationId && !conversation.application) {
    conversation.application = new mongoose.Types.ObjectId(applicationId);
    await conversation.save();
  }
  if (applicationId) {
    await ApplicationModel.updateOne(
      { _id: applicationId, conversation: null },
      { $set: { conversation: conversation._id } },
    );
  }

  const message = await postMessage(conversation, userId, input.text);
  const fresh = await ConversationModel.findById(conversation._id);

  return {
    conversation: (await hydrateMany(fresh ? [fresh] : [conversation], userId))[0]!,
    message,
  };
}

export async function sendMessage(
  userId: string,
  conversationId: string,
  body: string,
): Promise<Message> {
  const conversation = await participantConversation(userId, conversationId);
  return postMessage(conversation, userId, body);
}

/** Clears the caller's unread counter and stamps every message they can now see. */
export async function markRead(userId: string, conversationId: string): Promise<{ unread: 0 }> {
  const conversation = await participantConversation(userId, conversationId);

  await Promise.all([
    ConversationModel.updateOne(
      { _id: conversation._id },
      { $set: { [`unread.${userId}`]: 0 } },
    ),
    MessageModel.updateMany(
      { conversation: conversation._id, readBy: { $ne: userId } },
      { $addToSet: { readBy: new mongoose.Types.ObjectId(userId) } },
    ),
  ]);

  return { unread: 0 };
}

/* ---------------------------------------------------------------------- reads */

export async function listConversations(
  userId: string,
  query: ConversationQueryInput,
): Promise<{ items: Conversation[]; total: number }> {
  const filters: Record<string, unknown> = {
    participants: userId,
    hiddenFor: { $ne: new mongoose.Types.ObjectId(userId) },
  };
  if (query.job) filters.job = query.job;

  const [conversations, total] = await Promise.all([
    ConversationModel.find(filters)
      .sort({ 'lastMessage.at': -1, updatedAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    ConversationModel.countDocuments(filters),
  ]);

  const items = await hydrateMany(conversations, userId);

  // `q` matches the other person's name, available only after hydration.
  if (!query.q) return { items, total };

  const needle = query.q.toLowerCase();
  return {
    items: items.filter(
      (conversation) =>
        conversation.participants.some((user) => user.name.toLowerCase().includes(needle)) ||
        conversation.job?.title.toLowerCase().includes(needle),
    ),
    total,
  };
}

export async function getConversation(userId: string, id: string): Promise<Conversation> {
  const conversation = await participantConversation(userId, id);
  return (await hydrateMany([conversation], userId))[0]!;
}

/** `nextCursor` is the oldest id returned; pass it back for everything older. */
export async function listMessages(
  userId: string,
  conversationId: string,
  query: MessageQueryInput,
): Promise<{ items: Message[]; nextCursor: string | null }> {
  const conversation = await participantConversation(userId, conversationId);

  const filters: Record<string, unknown> = { conversation: conversation._id };
  if (query.cursor) filters._id = { $lt: new mongoose.Types.ObjectId(query.cursor) };

  // One extra row answers "is there more" without a second count query.
  const rows = await MessageModel.find(filters)
    .sort({ _id: -1 })
    .limit(query.limit + 1);

  const hasMore = rows.length > query.limit;
  const page = hasMore ? rows.slice(0, query.limit) : rows;

  const senders = await User.find({ _id: { $in: page.map((message) => message.sender) } });
  const senderById = new Map(senders.map((user) => [user._id.toString(), user]));

  const items = page.flatMap((message) => {
    const sender = senderById.get(message.sender.toString());
    return sender ? [toMessage(message, sender)] : [];
  });

  return {
    // Oldest first, the order a thread is read in.
    items: items.reverse(),
    nextCursor: hasMore ? (page[page.length - 1]?._id.toString() ?? null) : null,
  };
}

/** Total unread across every thread, for the badge in the app shell. */
export async function unreadCount(userId: string): Promise<{ total: number; threads: number }> {
  const conversations = await ConversationModel.find(
    { participants: userId, hiddenFor: { $ne: new mongoose.Types.ObjectId(userId) } },
    { unread: 1 },
  );

  let total = 0;
  let threads = 0;
  for (const conversation of conversations) {
    const count = conversation.unread.get(userId) ?? 0;
    if (count > 0) {
      total += count;
      threads += 1;
    }
  }

  return { total, threads };
}

/** Hides a thread for the caller only. The other side keeps their copy. */
export async function hideConversation(userId: string, conversationId: string): Promise<void> {
  const conversation = await participantConversation(userId, conversationId);
  await ConversationModel.updateOne(
    { _id: conversation._id },
    { $addToSet: { hiddenFor: new mongoose.Types.ObjectId(userId) } },
  );
}
