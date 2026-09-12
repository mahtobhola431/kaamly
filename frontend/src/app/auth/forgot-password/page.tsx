import type { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/auth/auth-forms';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Forgot password',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <p className="text-muted-foreground mt-2">
        Enter the email address on your account and we will send you a reset link.
      </p>

      <div className="mt-6">
        <ForgotPasswordForm />
      </div>

      <p className="text-muted-foreground mt-6 text-sm">
        Remembered it?{' '}
        <Link href={routes.login} className="text-primary font-medium hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
