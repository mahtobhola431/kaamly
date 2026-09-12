import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, HardHat } from 'lucide-react';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Join rokdajob',
  description: 'Choose whether you are looking for workers or looking for work.',
};

const CHOICES = [
  {
    href: routes.register('worker'),
    icon: HardHat,
    title: 'I am looking for work',
    body: 'Free profile. See jobs near your area with the rate written clearly, and apply in one tap.',
    tone: 'action' as const,
  },
  {
    href: routes.register('employer'),
    icon: Building2,
    title: 'I am hiring workers',
    body: 'Post jobs, search workers by distance and skill, and manage applicants from one dashboard.',
    tone: 'navy' as const,
  },
];

export default function ChooseRolePage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Which one are you?</h1>
      <p className="text-muted-foreground mt-2">
        This decides what your account looks like. You can create the other kind later with a
        different email address.
      </p>

      <div className="mt-6 space-y-3">
        {CHOICES.map((choice) => (
          <Link
            key={choice.href}
            href={choice.href}
            className="bg-card hover:border-action group flex items-start gap-4 rounded-lg border p-5 transition-all hover:shadow-[var(--shadow-raised)]"
          >
            <span
              className={
                choice.tone === 'action'
                  ? 'bg-action-subtle text-action-hover flex size-11 shrink-0 items-center justify-center rounded-md'
                  : 'bg-navy-50 text-navy-700 flex size-11 shrink-0 items-center justify-center rounded-md'
              }
            >
              <choice.icon className="size-5" aria-hidden />
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 font-semibold">
                {choice.title}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
              <span className="text-muted-foreground mt-1 block text-sm leading-relaxed">
                {choice.body}
              </span>
            </span>
          </Link>
        ))}
      </div>

      <p className="text-muted-foreground mt-6 text-sm">
        Already have an account?{' '}
        <Link href={routes.login} className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
