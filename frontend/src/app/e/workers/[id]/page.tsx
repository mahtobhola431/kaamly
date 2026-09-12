import { redirect } from 'next/navigation';
import { routes } from '@/lib/routes';

/**
 * There is one worker profile in this product, not an employer-only copy of it.
 *
 * Keeping a second layout in sync with the public one would guarantee drift, so the CRM
 * route redirects to the canonical profile page.
 */
export default async function EmployerWorkerRedirect(props: PageProps<'/e/workers/[id]'>) {
  const { id } = await props.params;
  redirect(routes.workerProfile(id));
}
