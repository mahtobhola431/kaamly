'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type FieldValues, type Path, type UseFormSetError } from 'react-hook-form';
import { z } from 'zod';
import type { AuthSession } from '@rokdajob/shared';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ApiClientError, api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { postAuthRoute, safeNextPath } from '@/lib/auth/session';
import { sessionEnded, sessionStarted } from '@/lib/store';
import { useAppDispatch } from '@/lib/store/hooks';
import { apiUrl } from '@/lib/env';
import { routes } from '@/lib/routes';

/**
 * Auth forms.
 *
 * Validation mirrors the zod schemas in `@rokdajob/shared` (`registerSchema`,
 * `loginSchema`), so the server is the only authority but the user does not have to wait
 * for a round trip to learn a password is too short. Sign-in is email/username + password,
 * or Google — there is no phone or OTP path.
 */

/**
 * Turns an API failure into something the form can show.
 *
 * Field-level problems (`username` already taken) are attached to the input that caused
 * them; everything else becomes a toast, because there is no field to point at.
 */
function useApiFormError<T extends FieldValues>(setError: UseFormSetError<T>) {
  return (error: unknown, fallback: string): void => {
    if (!(error instanceof ApiClientError)) {
      toast.error(fallback);
      return;
    }

    const fields = error.fieldErrors();
    const paths = Object.keys(fields);

    if (paths.length > 0) {
      for (const path of paths) {
        setError(path as Path<T>, { type: 'server', message: fields[path] });
      }
      return;
    }

    // A duplicate email or username comes back as a 409 with no field path.
    if (error.status === 409) {
      const message = error.message.toLowerCase();
      if (message.includes('username')) {
        setError('username' as Path<T>, { type: 'server', message: error.message });
        return;
      }
      if (message.includes('email')) {
        setError('email' as Path<T>, { type: 'server', message: error.message });
        return;
      }
    }

    toast.error(error.message || fallback);
  };
}

/** Mirrors `usernameSchema` in @rokdajob/shared. */
const username = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'At least 3 characters')
  .max(30, 'At most 30 characters')
  .regex(/^[a-z][a-z0-9_.]*$/, 'Start with a letter; letters, numbers, dots and underscores only')
  .refine((value) => !/[._]{2}/.test(value), 'No repeated dots or underscores')
  .refine((value) => !/[._]$/.test(value), 'Cannot end with a dot or underscore');

const password = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/[a-zA-Z]/, 'Must contain a letter')
  .regex(/\d/, 'Must contain a number');

const email = z.string().trim().toLowerCase().email('Enter a valid email address');

function PasswordInput(props: React.ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? 'text' : 'password'} className="pr-10" />
      <button
        type="button"
        onClick={() => setVisible((previous) => !previous)}
        className="text-muted-foreground hover:text-foreground absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden />
        ) : (
          <Eye className="size-4" aria-hidden />
        )}
      </button>
    </div>
  );
}

/**
 * Google sign-in. A plain link, not a fetch: OAuth needs a top-level navigation so the
 * backend can set the refresh cookie and hand control to Google.
 */
function GoogleButton({
  role,
  label,
  next,
}: {
  role?: 'WORKER' | 'EMPLOYER';
  label: string;
  /** Carried through Google and back, so an interrupted action resumes here too. */
  next?: string;
}) {
  // The token comes back in the URL fragment, which only `/auth/callback` knows how to
  // read — so `next` rides along as one of its parameters rather than replacing it.
  const query = new URLSearchParams({
    ...(role ? { role } : {}),
    ...(next ? { redirect: `/auth/callback?next=${encodeURIComponent(next)}` } : {}),
  }).toString();

  return (
    <Button asChild variant="outline" className="w-full">
      <a href={apiUrl(query ? `/auth/google?${query}` : '/auth/google')}>
        <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#4285F4"
            d="M21.6 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.89-1.74 2.98-4.3 2.98-7.35Z"
          />
          <path
            fill="#34A853"
            d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.59A10 10 0 0 0 12 22Z"
          />
          <path
            fill="#FBBC05"
            d="M6.41 13.92a6 6 0 0 1 0-3.84V7.49H3.06a10 10 0 0 0 0 9.02l3.35-2.59Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87A10 10 0 0 0 3.06 7.49l3.35 2.59C7.2 7.72 9.4 5.96 12 5.96Z"
          />
        </svg>
        {label}
      </a>
    </Button>
  );
}

/**
 * The page to return to after signing in, with the interrupted action attached.
 *
 * `signInHref` sends `next` (where they were) and `intent` (what they were about to do)
 * as separate parameters; they are merged back into one URL here so the destination can
 * pick the action up again — a worker who pressed "Apply" while signed out lands back on
 * the job with the apply sheet already open.
 */
function returnPath(params: ReturnType<typeof useSearchParams>): string | undefined {
  const next = safeNextPath(params.get('next'));
  if (!next) return undefined;

  const intent = params.get('intent');
  if (!intent) return next;

  const [path, existing] = next.split('#')[0]!.split('?');
  const query = new URLSearchParams(existing);
  query.set('intent', intent);
  return `${path}?${query.toString()}`;
}

function OrDivider() {
  return (
    <div className="relative py-2 text-center">
      <span className="bg-border absolute inset-x-0 top-1/2 h-px" aria-hidden />
      <span className="bg-background text-muted-foreground relative px-3 text-xs">or</span>
    </div>
  );
}

/* ------------------------------------------------------------------------ login */

const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Enter your email address or username'),
  password: z.string().min(1, 'Enter your password'),
});

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  // Set when the user was part-way through something — applying to a job, writing to an
  // employer — and had to sign in first. They go back to it instead of to a dashboard.
  const next = returnPath(searchParams);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });
  const showApiError = useApiFormError(setError);

  async function onSubmit(values: z.infer<typeof loginSchema>): Promise<void> {
    try {
      const session = await api.post<AuthSession>('/auth/login', values);
      dispatch(sessionStarted({ user: session.user, accessToken: session.tokens.accessToken }));
      router.push(postAuthRoute(session.user, next));
      router.refresh();
    } catch (error) {
      // A blocked account is not a bad password: send them somewhere that explains it.
      if (error instanceof ApiClientError && error.code === 'ACCOUNT_PENDING_APPROVAL') {
        router.push(routes.pending);
        return;
      }
      showApiError(error, 'Could not sign you in. Please try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="identifier">Email or username</Label>
        <Input
          id="identifier"
          {...register('identifier')}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={Boolean(errors.identifier)}
          placeholder="you@example.com"
        />
        {errors.identifier ? (
          <p className="text-destructive text-sm">{errors.identifier.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href={routes.forgotPassword}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Forgot?
          </Link>
        </div>
        <PasswordInput
          id="password"
          {...register('password')}
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
        />
        {errors.password ? (
          <p className="text-destructive text-sm">{errors.password.message}</p>
        ) : null}
      </div>

      <Button type="submit" variant="action" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : null}
        Sign in
      </Button>

      <OrDivider />

      <GoogleButton label="Continue with Google" next={next} />
    </form>
  );
}

/* --------------------------------------------------------------------- register */

const baseRegister = {
  name: z.string().trim().min(2, 'Enter your name'),
  username,
  email,
  password,
};

const workerRegisterSchema = z.object(baseRegister);
const employerRegisterSchema = z.object({
  ...baseRegister,
  companyName: z.string().trim().min(2, 'Enter your company name'),
});

export function RegisterForm({ role }: { role: 'worker' | 'employer' }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const next = returnPath(searchParams);
  const isEmployer = role === 'employer';
  const schema = isEmployer ? employerRegisterSchema : workerRegisterSchema;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof employerRegisterSchema>>({
    resolver: zodResolver(schema as typeof employerRegisterSchema),
  });
  const showApiError = useApiFormError(setError);

  async function onSubmit(values: z.infer<typeof employerRegisterSchema>): Promise<void> {
    // The worker schema has no company name, so never send an empty one.
    const payload = isEmployer
      ? { ...values, role: 'EMPLOYER' as const }
      : {
          role: 'WORKER' as const,
          name: values.name,
          username: values.username,
          email: values.email,
          password: values.password,
        };

    try {
      const session = await api.post<AuthSession>('/auth/register', payload);
      dispatch(sessionStarted({ user: session.user, accessToken: session.tokens.accessToken }));

      toast.success(
        isEmployer ? 'Account created — pending approval' : `Welcome, ${session.user.name}`,
      );
      router.push(postAuthRoute(session.user, next));
      router.refresh();
    } catch (error) {
      showApiError(error, 'Could not create your account. Please try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Your name</Label>
        <Input
          id="name"
          {...register('name')}
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name ? <p className="text-destructive text-sm">{errors.name.message}</p> : null}
      </div>

      {isEmployer ? (
        <div className="space-y-1.5">
          <Label htmlFor="companyName">Company name</Label>
          <Input
            id="companyName"
            {...register('companyName')}
            autoComplete="organization"
            aria-invalid={Boolean(errors.companyName)}
          />
          {errors.companyName ? (
            <p className="text-destructive text-sm">{errors.companyName.message}</p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="email">{isEmployer ? 'Work email' : 'Email address'}</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={Boolean(errors.email)}
        />
        <p className="text-muted-foreground text-xs">
          You sign in with this, and we send a confirmation link to it.
        </p>
        {errors.email ? <p className="text-destructive text-sm">{errors.email.message}</p> : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          {...register('username')}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="ravi.kumar"
          aria-invalid={Boolean(errors.username)}
        />
        <p className="text-muted-foreground text-xs">
          You can sign in with this instead of your email address.
        </p>
        {errors.username ? (
          <p className="text-destructive text-sm">{errors.username.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Create a password</Label>
        <PasswordInput
          id="password"
          {...register('password')}
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
        />
        {errors.password ? (
          <p className="text-destructive text-sm">{errors.password.message}</p>
        ) : null}
      </div>

      <Button type="submit" variant="action" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {isEmployer ? 'Create employer account' : 'Create free account'}
      </Button>

      <OrDivider />

      <GoogleButton role={isEmployer ? 'EMPLOYER' : 'WORKER'} label="Sign up with Google" next={next} />
    </form>
  );
}

/* ---------------------------------------------------------------- password reset */

const forgotSchema = z.object({ email });

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof forgotSchema>>({ resolver: zodResolver(forgotSchema) });

  if (sent) {
    return (
      <div className="bg-success-subtle border-success/25 rounded-lg border p-5 text-sm">
        <p className="font-medium">If that address has an account, a reset link is on its way.</p>
        <p className="text-muted-foreground mt-2">
          No mail transport is connected yet, so the link is written to the API server log.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href={routes.login}>Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        try {
          await api.post('/auth/password/forgot', values);
        } catch {
          // The endpoint answers identically for unknown addresses, so the only failures
          // are transport ones. Showing the same screen keeps that guarantee intact.
        }
        setSent(true);
      })}
      noValidate
      className="space-y-4"
    >
      <div className="space-y-1.5">
        <Label htmlFor="forgot-email">Email address</Label>
        <Input
          id="forgot-email"
          type="email"
          {...register('email')}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email ? <p className="text-destructive text-sm">{errors.email.message}</p> : null}
      </div>

      <Button type="submit" variant="action" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : null}
        Send reset link
      </Button>
    </form>
  );
}

const resetSchema = z
  .object({
    password,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export function ResetPasswordForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) });
  const showApiError = useApiFormError(setError);

  if (!token) {
    return (
      <div className="bg-muted rounded-lg border p-5 text-sm">
        <p className="font-medium">This reset link is incomplete.</p>
        <p className="text-muted-foreground mt-2">
          Open the link from your email exactly as it was sent, or request a new one.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href={routes.forgotPassword}>Request a new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        try {
          await api.post('/auth/password/reset', { ...values, token });
          // Every session was revoked server-side, so the only way on is a fresh sign-in.
          dispatch(sessionEnded());
          toast.success('Password changed. Please sign in.');
          router.push(routes.login);
        } catch (error) {
          showApiError(error, 'Could not change your password. Request a new link.');
        }
      })}
      noValidate
      className="space-y-4"
    >
      <div className="space-y-1.5">
        <Label htmlFor="new-password">New password</Label>
        <PasswordInput
          id="new-password"
          {...register('password')}
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
        />
        {errors.password ? (
          <p className="text-destructive text-sm">{errors.password.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <PasswordInput
          id="confirm-password"
          {...register('confirmPassword')}
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
        />
        {errors.confirmPassword ? (
          <p className="text-destructive text-sm">{errors.confirmPassword.message}</p>
        ) : null}
      </div>

      <Button type="submit" variant="action" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : null}
        Set new password
      </Button>
    </form>
  );
}
