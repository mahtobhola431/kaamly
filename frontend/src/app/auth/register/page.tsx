import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/auth-forms';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Create an account',
  description:
    'Join rokdajob as a worker looking for nearby work, or as an employer hiring near your site.',
};

export default async function RegisterPage(props: PageProps<'/auth/register'>) {
  const raw = await props.searchParams;
  const roleParam = typeof raw.role === 'string' ? raw.role : undefined;
  const role = roleParam === 'employer' ? 'employer' : 'worker';

  return (
    <>
      <h1 className="text-2xl font-bold">
        {role === 'employer' ? 'Create an employer account' : 'Create a worker account'}
      </h1>
      <p className="text-muted-foreground mt-2">
        {role === 'employer'
          ? 'Post jobs and search workers near your sites.'
          : 'Free forever. See work near you and apply in one tap.'}
      </p>

      <div className="mt-6">
        {/* Reads `?next=`, so it renders on the client — see the login page. */}
        <Suspense fallback={<div className="bg-muted h-96 animate-pulse rounded-lg" />}>
          <RegisterForm role={role} />
        </Suspense>
      </div>

      <div className="text-muted-foreground mt-6 space-y-2 text-sm">
        <p>
          {role === 'employer' ? 'Looking for work instead? ' : 'Hiring workers instead? '}
          <Link
            href={routes.register(role === 'employer' ? 'worker' : 'employer')}
            className="text-primary font-medium hover:underline"
          >
            {role === 'employer' ? 'Create a worker account' : 'Create an employer account'}
          </Link>
        </p>
        <p>
          Already have an account?{' '}
          <Link href={routes.login} className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}
