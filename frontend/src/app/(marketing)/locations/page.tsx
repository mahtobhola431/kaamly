import type { Metadata } from 'next';
import Link from 'next/link';
import { getCities } from '@/lib/data/catalog';
import { getJobCountsByCity } from '@/lib/data/jobs';
import { getWorkerCountsByCity } from '@/lib/data/workers';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Cities and localities we cover',
  description:
    'rokdajob covers Mumbai, Thane, Navi Mumbai, Bhiwandi, Pune, Nashik, Ahmedabad, Surat, Bengaluru, Hyderabad, Delhi, Noida, Gurugram, Chennai and Kolkata, down to locality and pincode.',
  alternates: { canonical: '/locations' },
};

export default async function LocationsPage() {
  const [cities, jobCounts, workerCounts] = await Promise.all([
    getCities(),
    getJobCountsByCity(),
    getWorkerCountsByCity(),
  ]);

  const byState = cities.reduce<Record<string, typeof cities>>((groups, city) => {
    const list = groups[city.state] ?? [];
    groups[city.state] = [...list, city];
    return groups;
  }, {});

  return (
    <>
      <header className="bg-muted/40 border-b">
        <div className="container-marketing py-10">
          <h1 className="text-2xl font-bold md:text-3xl">Where rokdajob works</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Locations are modelled as a hierarchy — state, district, city, locality, pincode — so
            distance search stays accurate down to the neighbourhood rather than the whole city.
          </p>
        </div>
      </header>

      <div className="container-marketing space-y-10 py-10">
        {Object.entries(byState).map(([state, stateCities]) => (
          <section key={state} aria-labelledby={`state-${state}`}>
            <h2 id={`state-${state}`} className="text-lg font-semibold">
              {state}
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stateCities.map((city) => (
                <article key={city.slug} className="bg-card rounded-lg border p-4">
                  <h3 className="font-semibold">
                    <Link href={routes.jobsByCity(city.slug)} className="hover:text-primary">
                      {city.name}
                    </Link>
                  </h3>
                  <p className="text-muted-foreground text-xs">{city.district} district</p>
                  <p className="text-muted-foreground mt-2 text-sm" data-numeric>
                    {jobCounts[city.slug] ?? 0} jobs · {workerCounts[city.slug] ?? 0} workers
                  </p>

                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {city.localities.map((locality) => (
                      <li key={locality.slug}>
                        <Link
                          href={`${routes.jobs}?city=${city.slug}&locality=${locality.slug}`}
                          className="text-muted-foreground hover:border-action/50 hover:text-foreground inline-flex rounded-md border px-2 py-1 text-xs transition-colors"
                        >
                          {locality.name}
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 flex gap-3 text-sm">
                    <Link
                      href={routes.jobsByCity(city.slug)}
                      className="text-primary font-medium hover:underline"
                    >
                      Jobs
                    </Link>
                    <Link
                      href={`${routes.workers}?city=${city.slug}`}
                      className="text-primary font-medium hover:underline"
                    >
                      Workers
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
