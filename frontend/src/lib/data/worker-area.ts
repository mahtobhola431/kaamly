import type {
  Application,
  Notification,
  Review,
  WorkerDashboardStats,
  WorkerProfile,
} from '@rokdajob/shared';
import { workerApplications } from '@/data/applications';
import { workerDashboardStats } from '@/data/insights';
import { workerNotifications } from '@/data/notifications';
import { reviewsForWorker } from '@/data/reviews';
import { currentWorker } from '@/data/workers';
import { daysAgo } from '@/data/time';

/** Everything the signed-in worker's own screens read. Maps onto `/me/*`. */

export async function getCurrentWorker(): Promise<WorkerProfile> {
  return currentWorker;
}

export async function getWorkerDashboard(): Promise<WorkerDashboardStats> {
  return workerDashboardStats;
}

export async function getMyApplications(): Promise<Application[]> {
  return workerApplications;
}

export async function getMyReviews(): Promise<Review[]> {
  return reviewsForWorker(currentWorker.user.id);
}

export async function getMyNotifications(): Promise<Notification[]> {
  return workerNotifications;
}

export interface WorkHistoryEntry {
  id: string;
  company: string;
  role: string;
  location: string;
  from: string;
  to: string;
  daysWorked: number;
  verified: boolean;
}

export async function getWorkHistory(): Promise<WorkHistoryEntry[]> {
  return [
    {
      id: 'wh_1',
      company: 'Shreeji Infra Contractors',
      role: 'Mason — shop renovation',
      location: 'Dadar, Mumbai',
      from: daysAgo(50),
      to: daysAgo(36),
      daysWorked: 14,
      verified: true,
    },
    {
      id: 'wh_2',
      company: 'Aadhar Buildcon Pvt Ltd',
      role: 'Mason — tower brickwork',
      location: 'Panvel, Navi Mumbai',
      from: daysAgo(160),
      to: daysAgo(62),
      daysWorked: 84,
      verified: true,
    },
    {
      id: 'wh_3',
      company: 'Independent contract',
      role: 'Tile work — residential flats',
      location: 'Andheri East, Mumbai',
      from: daysAgo(240),
      to: daysAgo(175),
      daysWorked: 52,
      verified: false,
    },
  ];
}

/** Suggestions that move the profile completion bar, shown on the worker home. */
export async function getProfileTasks(): Promise<
  { id: string; label: string; done: boolean; href: string }[]
> {
  const worker = currentWorker;
  return [
    { id: 'basics', label: 'Add your name and area', done: true, href: '/w/profile/edit' },
    {
      id: 'skills',
      label: 'Select your skills',
      done: worker.skills.length > 0,
      href: '/w/profile/skills',
    },
    { id: 'wage', label: 'Set your expected wage', done: true, href: '/w/profile/edit' },
    {
      id: 'phone',
      label: 'Verify your phone number',
      done: worker.verification.phone,
      href: '/w/profile',
    },
    {
      id: 'documents',
      label: 'Upload ID and certificates',
      done: worker.verification.documents,
      href: '/w/profile/documents',
    },
    {
      id: 'photo',
      label: 'Add a profile photo',
      done: Boolean(worker.user.avatarUrl),
      href: '/w/profile/edit',
    },
  ];
}
