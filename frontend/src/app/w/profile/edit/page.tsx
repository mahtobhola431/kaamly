import type { Metadata } from 'next';
import { WorkerProfileForm } from '@/components/domain/worker-profile-form';
import { getCities } from '@/lib/data/catalog';
import { getCurrentWorker } from '@/lib/data/worker-area';

export const metadata: Metadata = {
  title: 'Edit profile',
  robots: { index: false, follow: false },
};

export default async function EditProfilePage() {
  const [worker, cities] = await Promise.all([getCurrentWorker(), getCities()]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold sm:text-2xl">Edit your profile</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Employers see this when they search for workers near their site.
      </p>

      <div className="mt-5">
        <WorkerProfileForm worker={worker} cities={cities} />
      </div>
    </div>
  );
}
