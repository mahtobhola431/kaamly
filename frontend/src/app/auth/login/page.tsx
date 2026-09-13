import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/auth-forms';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to rokdajob to manage your hiring or your applications.',
};

export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="text-muted-foreground mt-2">Sign in to continue where you left off.</p>

      <div className="mt-6">
        {/*
          The form reads `?next=`, which is only known at request time. The Suspense
          boundary is what lets the rest of this page prerender.
        */}
        <Suspense fallback={<div className="bg-muted h-64 animate-pulse rounded-lg" />}>
          <LoginForm />
        </Suspense>
      </div>

      <p className="text-muted-foreground mt-6 text-sm">
        New here?{' '}
        <Link href={routes.chooseRole} className="text-primary font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
