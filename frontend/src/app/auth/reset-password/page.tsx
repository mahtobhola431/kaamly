import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/auth/auth-forms';

export const metadata: Metadata = {
  title: 'Set a new password',
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Set a new password</h1>
      <p className="text-muted-foreground mt-2">
        Choose something you will remember. At least 8 characters with a letter and a number.
      </p>

      <div className="mt-6">
        {/*
          The form reads the `?token=` query parameter, which is only known at request
          time. The Suspense boundary is what lets the rest of this page prerender.
        */}
        <Suspense fallback={<div className="bg-muted h-48 animate-pulse rounded-lg" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </>
  );
}
