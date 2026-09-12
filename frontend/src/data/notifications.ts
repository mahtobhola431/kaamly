import type { Notification, NotificationType } from '@rokdajob/shared';
import { hoursAgo, minutesAgo } from './time';

/**
 * Demo notifications for both sides of the marketplace.
 * `data` carries the deep-link target the real notification service will populate.
 */

interface NotificationSeed {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  minutesAgo: number;
  read?: boolean;
}

function build(seeds: NotificationSeed[]): Notification[] {
  return seeds.map((seed) => {
    const at = seed.minutesAgo < 60 ? minutesAgo(seed.minutesAgo) : hoursAgo(seed.minutesAgo / 60);
    return {
      id: `ntf_${seed.id}`,
      type: seed.type,
      title: seed.title,
      body: seed.body,
      data: { href: seed.href },
      readAt: seed.read ? at : null,
      createdAt: at,
      updatedAt: at,
    };
  });
}

export const workerNotifications: Notification[] = build([
  {
    id: 'w1',
    type: 'WORKER_INVITED',
    title: 'Shreeji Infra invited you to apply',
    body: 'Lead mason for the Kalher warehouse site, ₹900/day for 15 days.',
    href: '/w/applications',
    minutesAgo: 100,
  },
  {
    id: 'w2',
    type: 'NEW_MESSAGE',
    title: 'New message from Sunita Rane',
    body: 'Accommodation is available at the site. Can you visit on Thursday?',
    href: '/w/messages',
    minutesAgo: 140,
  },
  {
    id: 'w3',
    type: 'JOB_NEARBY',
    title: '6 new jobs near Andheri East',
    body: 'Masonry and tiling work posted within 15 km of you today.',
    href: '/w/jobs',
    minutesAgo: 320,
  },
  {
    id: 'w4',
    type: 'APPLICATION_SHORTLISTED',
    title: 'You were shortlisted',
    body: 'Aadhar Buildcon shortlisted you for Masons for slab and brickwork — Panvel.',
    href: '/w/applications',
    minutesAgo: 2200,
    read: true,
  },
  {
    id: 'w5',
    type: 'REVIEW_RECEIVED',
    title: 'Shreeji Infra rated you 5 stars',
    body: '"Finished the Dadar shop work ahead of schedule. Will hire again."',
    href: '/w/reviews',
    minutesAgo: 4000,
    read: true,
  },
  {
    id: 'w6',
    type: 'PROFILE_VERIFIED',
    title: 'Your documents were approved',
    body: 'Your Aadhaar and skill certificate have been verified.',
    href: '/w/profile',
    minutesAgo: 8000,
    read: true,
  },
]);

export const employerNotifications: Notification[] = build([
  {
    id: 'e1',
    type: 'APPLICATION_RECEIVED',
    title: '4 new applications today',
    body: 'Need 15 construction helpers for warehouse site.',
    href: '/e/jobs/construction-helpers-bhiwandi-warehouse-site/applicants',
    minutesAgo: 35,
  },
  {
    id: 'e2',
    type: 'WORKER_ACCEPTED',
    title: 'Imran Shaikh accepted your offer',
    body: 'Joining Monday for the Andheri tower wiring.',
    href: '/e/applicants',
    minutesAgo: 90,
  },
  {
    id: 'e3',
    type: 'NEW_MESSAGE',
    title: 'Ravi Verma replied',
    body: 'My team is three people. Can we take 4 flats a week?',
    href: '/e/messages',
    minutesAgo: 95,
  },
  {
    id: 'e4',
    type: 'JOB_STATUS_CHANGED',
    title: 'Bar benders and steel fixers is now filled',
    body: 'All 8 positions have been hired. Reopen the job if you need more workers.',
    href: '/e/jobs',
    minutesAgo: 600,
    read: true,
  },
  {
    id: 'e5',
    type: 'REMINDER',
    title: 'Office cleaning staff — Bandra is paused',
    body: 'This job has been paused for 9 days. Resume it or close it.',
    href: '/e/jobs',
    minutesAgo: 1400,
    read: true,
  },
  {
    id: 'e6',
    type: 'PROFILE_VERIFIED',
    title: 'Company verification approved',
    body: 'Shreeji Infra Contractors is now a verified company on rokdajob.',
    href: '/e/company',
    minutesAgo: 5000,
    read: true,
  },
]);

export const workerUnreadNotifications = workerNotifications.filter(
  (notification) => notification.readAt === null,
).length;

export const employerUnreadNotifications = employerNotifications.filter(
  (notification) => notification.readAt === null,
).length;
