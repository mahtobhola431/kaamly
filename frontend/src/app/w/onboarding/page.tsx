import type { Metadata } from 'next';
import { WorkerOnboarding } from '@/components/domain/worker-onboarding';
import { getCategories, getCities, getSkills } from '@/lib/data/catalog';

export const metadata: Metadata = {
  title: 'Set up your profile',
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const [cities, categories, skills] = await Promise.all([
    getCities(),
    getCategories(),
    getSkills(),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold sm:text-2xl">Set up your profile</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Five short steps. After this, employers near you can find you.
      </p>

      <div className="mt-6">
        <WorkerOnboarding cities={cities} categories={categories} skills={skills} />
      </div>
    </div>
  );
}
