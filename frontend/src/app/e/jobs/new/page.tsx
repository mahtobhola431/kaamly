import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { JobPostForm } from '@/components/domain/job-post-form';
import { Button } from '@/components/ui/button';
import { getCategories, getCities, getSkills } from '@/lib/data/catalog';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Post a job',
  robots: { index: false, follow: false },
};

export default async function NewJobPage() {
  const [cities, categories, skills] = await Promise.all([
    getCities(),
    getCategories(),
    getSkills(),
  ]);

  return (
    <div className="max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={routes.e.jobs}>
          <ArrowLeft aria-hidden />
          Back to jobs
        </Link>
      </Button>

      <h1 className="mt-2 text-xl font-bold sm:text-2xl">Post a job</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Workers within travel distance of the site will see this in their nearby feed. The clearer
        the rate and timing, the better the applicants.
      </p>

      <div className="mt-6">
        <JobPostForm cities={cities} categories={categories} skills={skills} />
      </div>
    </div>
  );
}
