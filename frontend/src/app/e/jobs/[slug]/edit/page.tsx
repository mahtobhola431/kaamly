import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { JobPostForm } from '@/components/domain/job-post-form';
import { Button } from '@/components/ui/button';
import { getCategories, getCities, getSkills } from '@/lib/data/catalog';
import { getEmployerJob, getEmployerJobs } from '@/lib/data/employer';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Edit job',
  robots: { index: false, follow: false },
};

export async function generateStaticParams() {
  const jobs = await getEmployerJobs();
  return jobs.map((job) => ({ slug: job.slug }));
}

export default async function EditJobPage(props: PageProps<'/e/jobs/[slug]/edit'>) {
  const { slug } = await props.params;
  const [job, cities, categories, skills] = await Promise.all([
    getEmployerJob(slug),
    getCities(),
    getCategories(),
    getSkills(),
  ]);
  if (!job) notFound();

  return (
    <div className="max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={routes.e.job(slug)}>
          <ArrowLeft aria-hidden />
          Back to job
        </Link>
      </Button>

      <h1 className="mt-2 text-xl font-bold sm:text-2xl">Edit job</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Editing {job.title}. Changes are not saved until the jobs API is connected, so this form
        starts from the standard defaults rather than the existing values.
      </p>

      <div className="mt-6">
        <JobPostForm cities={cities} categories={categories} skills={skills} />
      </div>
    </div>
  );
}
