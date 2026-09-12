import type { Metadata } from 'next';
import Link from 'next/link';
import { getCategories, getSkills } from '@/lib/data/catalog';
import { getJobCountsByCategory } from '@/lib/data/jobs';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Work categories and trades',
  description:
    'Every trade on rokdajob — construction, electrical, plumbing, mechanical, warehouse, hospitality, appliance services, transport and facility work.',
  alternates: { canonical: '/categories' },
};

export default async function CategoriesPage() {
  const [categories, skills, jobCounts] = await Promise.all([
    getCategories(),
    getSkills(),
    getJobCountsByCategory(),
  ]);

  return (
    <>
      <header className="bg-muted/40 border-b">
        <div className="container-marketing py-10">
          <h1 className="text-2xl font-bold md:text-3xl">Work categories</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Categories and skills are stored in the database and managed from the admin panel, so
            new trades can be added without shipping a release.
          </p>
        </div>
      </header>

      <div className="container-marketing py-10">
        <div className="grid gap-8">
          {categories.map((category) => {
            const categorySkills = skills.filter((skill) => skill.category.slug === category.slug);
            const count = jobCounts[category.slug] ?? 0;

            return (
              <section key={category.id} aria-labelledby={`cat-${category.slug}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 id={`cat-${category.slug}`} className="text-lg font-semibold">
                    <Link
                      href={`${routes.jobs}?category=${category.slug}`}
                      className="hover:text-primary"
                    >
                      {category.name}
                    </Link>
                  </h2>
                  <span className="text-muted-foreground text-sm" data-numeric>
                    {count} open {count === 1 ? 'job' : 'jobs'} · {categorySkills.length} trades
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">{category.description}</p>

                <ul className="mt-3 flex flex-wrap gap-2">
                  {categorySkills.map((skill) => (
                    <li key={skill.id}>
                      <Link
                        href={`${routes.workers}?skill=${skill.slug}`}
                        className="bg-card hover:border-action/50 hover:text-action-hover inline-flex rounded-md border px-3 py-1.5 text-sm transition-colors"
                      >
                        {skill.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
