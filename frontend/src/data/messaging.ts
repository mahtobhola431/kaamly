import type { Conversation, Message, PublicUser } from '@rokdajob/shared';
import { currentEmployer, employerByCompanySlug } from './companies';
import { jobOf } from './jobs';
import { currentWorker, workerOf } from './workers';
import { hoursAgo, minutesAgo } from './time';

/**
 * Demo conversations between employers and workers.
 *
 * Every thread carries job context, which is what makes this feel like a hiring inbox
 * rather than a generic chat app.
 */

interface ThreadSeed {
  id: string;
  worker: string;
  companySlug: string;
  job: string;
  unread: number;
  messages: { from: 'worker' | 'employer'; body: string; minutesAgo: number }[];
}

const THREAD_SEEDS: ThreadSeed[] = [
  {
    id: 'sunil-helpers',
    worker: 'sunil-yadav',
    companySlug: 'shreeji-infra-contractors',
    job: 'construction-helpers-bhiwandi-warehouse-site',
    unread: 2,
    messages: [
      {
        from: 'employer',
        body: 'Sunil, we have shortlisted you for the Kalher site. Can you start tomorrow at 8 AM?',
        minutesAgo: 210,
      },
      { from: 'worker', body: 'Yes sir, I will come. Where should I report?', minutesAgo: 190 },
      {
        from: 'employer',
        body: 'Report at the site gate on Kalher Road, ask for Nitin. Bring your Aadhaar copy.',
        minutesAgo: 120,
      },
      { from: 'worker', body: 'Thik hai sir. Kitne din ka kaam hai?', minutesAgo: 45 },
      {
        from: 'employer',
        body: 'About 15 days, may extend. Payment every Saturday.',
        minutesAgo: 22,
      },
      { from: 'employer', body: 'Accommodation is available if you need it.', minutesAgo: 18 },
    ],
  },
  {
    id: 'imran-electrician',
    worker: 'imran-shaikh',
    companySlug: 'shreeji-infra-contractors',
    job: 'electricians-andheri-residential-tower',
    unread: 0,
    messages: [
      {
        from: 'worker',
        body: 'Sir, I have applied for the Andheri wiring work. I have done a similar tower in Goregaon.',
        minutesAgo: 900,
      },
      { from: 'employer', body: 'Good. How many floors did you complete there?', minutesAgo: 860 },
      { from: 'worker', body: 'Full 11 floors, conduit to DB fitting.', minutesAgo: 850 },
      {
        from: 'employer',
        body: 'Rate is Rs 1,100 per day. Can you join from Monday?',
        minutesAgo: 700,
      },
      { from: 'worker', body: 'Yes sir, confirmed.', minutesAgo: 640 },
    ],
  },
  {
    id: 'ravi-painter',
    worker: 'ravi-verma',
    companySlug: 'shreeji-infra-contractors',
    job: 'painters-chembur-flats',
    unread: 1,
    messages: [
      {
        from: 'worker',
        body: 'Sir, for the Chembur flats — is material provided or do we arrange?',
        minutesAgo: 400,
      },
      {
        from: 'employer',
        body: 'Material is from our side. You bring only brushes and rollers.',
        minutesAgo: 320,
      },
      {
        from: 'worker',
        body: 'Okay. My team is three people. Can we take 4 flats a week?',
        minutesAgo: 95,
      },
    ],
  },
  {
    id: 'nadeem-tiles',
    worker: 'nadeem-khan',
    companySlug: 'shreeji-infra-contractors',
    job: 'tile-workers-okhla',
    unread: 0,
    messages: [
      {
        from: 'employer',
        body: 'Nadeem, are you free for the Okhla commercial floor?',
        minutesAgo: 3000,
      },
      {
        from: 'worker',
        body: 'Currently on another site, free from next Monday.',
        minutesAgo: 2900,
      },
      { from: 'employer', body: 'That works. I will keep you shortlisted.', minutesAgo: 2880 },
    ],
  },
  {
    id: 'rajesh-masons-panvel',
    worker: 'rajesh-kumar',
    companySlug: 'aadhar-buildcon',
    job: 'masons-panvel-tower-slab',
    unread: 1,
    messages: [
      {
        from: 'worker',
        body: 'Madam, I have applied for the Panvel mason work. I can bring 4 helpers with me.',
        minutesAgo: 2400,
      },
      {
        from: 'employer',
        body: 'That is useful. What rate are you expecting for the team?',
        minutesAgo: 2300,
      },
      { from: 'worker', body: 'For me Rs 950, helpers Rs 650 each per day.', minutesAgo: 2250 },
      {
        from: 'employer',
        body: 'Noted. Accommodation is available at the site. Can you visit on Thursday?',
        minutesAgo: 140,
      },
    ],
  },
  {
    id: 'rajesh-helpers-invite',
    worker: 'rajesh-kumar',
    companySlug: 'shreeji-infra-contractors',
    job: 'construction-helpers-bhiwandi-warehouse-site',
    unread: 0,
    messages: [
      {
        from: 'employer',
        body: 'Rajesh, we are looking for a lead mason at the Kalher warehouse site. Interested?',
        minutesAgo: 130,
      },
      { from: 'worker', body: 'Yes sir. What is the duration and rate?', minutesAgo: 110 },
      {
        from: 'employer',
        body: '15 days minimum, Rs 900 per day plus food. Interview tomorrow at 10 AM.',
        minutesAgo: 100,
      },
      { from: 'worker', body: 'I will be there.', minutesAgo: 90 },
    ],
  },
  {
    id: 'firoz-welder',
    worker: 'firoz-ansari',
    companySlug: 'shreeji-infra-contractors',
    job: 'welders-kalwa-fabrication',
    unread: 0,
    messages: [
      {
        from: 'employer',
        body: 'Railing work starts day after tomorrow at Kalwa.',
        minutesAgo: 700,
      },
      { from: 'worker', body: 'Understood. Machine will be on site?', minutesAgo: 690 },
      { from: 'employer', body: 'Yes, welding machine and safety gear are ours.', minutesAgo: 670 },
    ],
  },
];

function buildThread(seed: ThreadSeed): { conversation: Conversation; messages: Message[] } {
  const worker = workerOf(seed.worker);
  const employer = employerByCompanySlug[seed.companySlug];
  if (!employer) throw new Error(`No employer for company ${seed.companySlug}`);
  const job = jobOf(seed.job);

  const participants: PublicUser[] = [worker.user, employer.user];

  const messages: Message[] = seed.messages.map((message, index) => {
    const sender = message.from === 'worker' ? worker.user : employer.user;
    const at = minutesAgo(message.minutesAgo);
    return {
      id: `msg_${seed.id}_${index + 1}`,
      conversation: `cnv_${seed.id}`,
      sender,
      body: message.body,
      readBy: [sender.id],
      createdAt: at,
      updatedAt: at,
    };
  });

  const last = messages[messages.length - 1] as Message;

  return {
    conversation: {
      id: `cnv_${seed.id}`,
      participants,
      job: { id: job.id, title: job.title, slug: job.slug },
      lastMessage: { text: last.body, at: last.createdAt, by: last.sender.id },
      unreadCount: seed.unread,
      createdAt: hoursAgo(48),
      updatedAt: last.createdAt,
    },
    messages,
  };
}

const threads = THREAD_SEEDS.map(buildThread);

export const conversations: Conversation[] = threads
  .map((thread) => thread.conversation)
  .sort((a, b) => (b.lastMessage?.at ?? '').localeCompare(a.lastMessage?.at ?? ''));

export const messagesByConversation: Record<string, Message[]> = Object.fromEntries(
  threads.map((thread) => [thread.conversation.id, thread.messages]),
);

export function conversationOf(id: string): Conversation {
  const conversation = conversations.find((item) => item.id === id);
  if (!conversation) throw new Error(`Unknown conversation in demo data: ${id}`);
  return conversation;
}

export function messagesOf(conversationId: string): Message[] {
  return messagesByConversation[conversationId] ?? [];
}

/** The other side of a thread, relative to whoever is viewing it. */
export function counterpartOf(conversation: Conversation, viewerId: string): PublicUser {
  return (
    conversation.participants.find((participant) => participant.id !== viewerId) ??
    (conversation.participants[0] as PublicUser)
  );
}

export const employerConversations: Conversation[] = conversations.filter((conversation) =>
  conversation.participants.some((participant) => participant.id === currentEmployer.user.id),
);

export const workerConversations: Conversation[] = conversations.filter((conversation) =>
  conversation.participants.some((participant) => participant.id === currentWorker.user.id),
);

export const employerUnreadCount = employerConversations.reduce(
  (total, conversation) => total + conversation.unreadCount,
  0,
);

export const workerUnreadCount = workerConversations.reduce(
  (total, conversation) => total + conversation.unreadCount,
  0,
);
