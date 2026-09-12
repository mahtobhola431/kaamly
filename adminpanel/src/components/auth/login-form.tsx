'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { AuthSession } from '@rokdajob/shared';
import { Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react';
import { ApiClientError, api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { FieldError, Input, Label } from '@/components/ui/field';
import { clearSession, saveSession } from '@/lib/auth/session';

const schema = z.object({
  identifier: z.string().trim().min(3, 'Enter your email address or username'),
  password: z.string().min(1, 'Enter your password'),
});

/**
 * Admin sign-in.
 *
 * The endpoint is the same `/auth/login` the public apps use — role is not a login
 * parameter — so a worker or employer can authenticate successfully here and still be
 * turned away. That check happens after the token comes back, and the session is
 * discarded rather than stored, so a non-admin never holds a console session.
 */
export function AdminLoginForm() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [refused, setRefused] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  async function onSubmit(values: z.infer<typeof schema>): Promise<void> {
    setRefused(undefined);
    try {
      const session = await api.post<AuthSession>('/auth/login', values);

      if (session.user.role !== 'ADMIN') {
        clearSession();
        setRefused('That account is not an admin. Use your operations account.');
        return;
      }

      saveSession(session.user, session.tokens.accessToken);
      router.replace('/');
      router.refresh();
    } catch (error) {
      setRefused(
        error instanceof ApiClientError
          ? error.message
          : 'Could not sign you in. Please try again.',
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {refused ? (
        <div className="bg-destructive-subtle border-destructive/30 text-destructive flex items-start gap-2 rounded-md border p-3 text-sm">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{refused}</span>
        </div>
      ) : null}

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
        <FieldError message={errors.identifier?.message} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={visible ? 'text' : 'password'}
            className="pr-10"
            {...register('password')}
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
          />
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
        <FieldError message={errors.password?.message} />
      </div>

      <Button type="submit" variant="action" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : null}
        Sign in
      </Button>
    </form>
  );
}
