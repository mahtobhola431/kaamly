import type { Metadata } from 'next';
import Link from 'next/link';
import { SkillPicker } from '@/components/domain/skill-picker';
import { Button } from '@/components/ui/button';
import { getCategories, getSkills } from '@/lib/data/catalog';
import { getCurrentWorker } from '@/lib/data/worker-area';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Your skills',
  robots: { index: false, follow: false },
};

export default async function WorkerSkillsPage() {
  const [worker, categories, skills] = await Promise.all([
    getCurrentWorker(),
    getCategories(),
    getSkills(),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold sm:text-2xl">Your skills</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Pick every trade you can do. Employers search by skill, so more accurate skills means more
        of the right work.
      </p>

      <div className="mt-5">
        <SkillPicker
          categories={categories}
          skills={skills}
          initial={worker.skills.map((entry) => ({
            slug: entry.skill.slug,
            years: entry.years,
            level: entry.level,
          }))}
        />
      </div>

      <div className="mt-6">
        <Button asChild variant="ghost">
          <Link href={routes.w.profile}>Back to profile</Link>
        </Button>
      </div>
    </div>
  );
}
