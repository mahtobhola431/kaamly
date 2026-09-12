import type { Metadata } from 'next';
import { Plus } from 'lucide-react';
import { UserAvatar } from '@/components/domain/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { getCurrentEmployer } from '@/lib/data/employer';

export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false, follow: false },
};

const NOTIFICATION_PREFERENCES = [
  {
    id: 'new-application',
    label: 'New applications',
    help: 'When someone applies to one of your jobs.',
    on: true,
  },
  {
    id: 'worker-accepted',
    label: 'Invitation accepted',
    help: 'When a worker you invited applies.',
    on: true,
  },
  {
    id: 'job-filled',
    label: 'Job filled',
    help: 'When the last position on a job is hired.',
    on: true,
  },
  {
    id: 'messages',
    label: 'New messages',
    help: 'When a worker replies to you.',
    on: true,
  },
  {
    id: 'weekly-summary',
    label: 'Weekly hiring summary',
    help: 'A Monday email with applications, hires and open positions.',
    on: false,
  },
];

export default async function SettingsPage() {
  const employer = await getCurrentEmployer();

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold sm:text-2xl">Settings</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Account, team access and notifications. Nothing here saves yet — settings persist once the
        API is connected.
      </p>

      <section className="bg-card mt-5 rounded-lg border p-5">
        <h2 className="font-semibold">Your account</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="settings-name">Name</Label>
            <Input id="settings-name" defaultValue={employer.user.name} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="settings-role">Designation</Label>
            <Input id="settings-role" defaultValue={employer.designation ?? ''} />
          </div>
        </div>
        <Button variant="outline" size="sm" className="mt-4">
          Save changes
        </Button>
      </section>

      <section className="bg-card mt-4 rounded-lg border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Team access</h2>
            <p className="text-muted-foreground mt-0.5 text-sm">
              People who can post jobs and manage applicants for {employer.company.name}.
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Plus aria-hidden />
            Invite
          </Button>
        </div>

        <ul className="mt-4 divide-y">
          <li className="flex items-center gap-3 py-3">
            <UserAvatar user={employer.user} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{employer.user.name}</p>
              <p className="text-muted-foreground text-xs">{employer.designation}</p>
            </div>
            <Badge variant="secondary">Owner</Badge>
          </li>
        </ul>

        <p className="text-muted-foreground mt-3 text-xs">
          Your plan includes 1 CRM user. Growth includes 5.
        </p>
      </section>

      <section className="bg-card mt-4 rounded-lg border p-5">
        <h2 className="font-semibold">Notifications</h2>
        <ul className="mt-4 divide-y">
          {NOTIFICATION_PREFERENCES.map((preference) => (
            <li key={preference.id} className="flex items-start justify-between gap-4 py-3">
              <div>
                <Label htmlFor={preference.id} className="font-medium">
                  {preference.label}
                </Label>
                <p className="text-muted-foreground mt-0.5 text-xs">{preference.help}</p>
              </div>
              <Switch id={preference.id} defaultChecked={preference.on} />
            </li>
          ))}
        </ul>
      </section>

      <section className="border-destructive/25 mt-4 rounded-lg border p-5">
        <h2 className="text-destructive font-semibold">Danger zone</h2>
        <Separator className="my-3" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Close this account</p>
            <p className="text-muted-foreground text-xs">
              Removes your company profile and unpublishes every job.
            </p>
          </div>
          <Button variant="outline" size="sm" className="text-destructive border-destructive/30">
            Close account
          </Button>
        </div>
      </section>
    </div>
  );
}
