'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  APPLICATION_STAGE_LABEL,
  SALARY_TYPE_LABEL,
  formatRupees,
  type Application,
  type Job,
} from '@rokdajob/shared';
import { BadgeCheck, Check, Loader2, LogIn, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { StageBadge } from '@/components/domain/badges';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ApiClientError } from '@/lib/api/client';
import { useSession } from '@/lib/auth/use-session';
import { applyToJob, getMyApplicationForJob, withdrawApplication } from '@/lib/data/applications';
import { startConversation } from '@/lib/data/conversations';
import { routes } from '@/lib/routes';

/**
 * Applying to a job, and writing to the employer about one.
 *
 * The job page is static and public — it is what Google indexes — so everything that
 * depends on who is looking happens here, after the page has painted.
 *
 * Signed out, the press is remembered: sign in with `next` (this job) and `intent=apply`,
 * and the sheet reopens on return rather than making them find the button again.
 */

type Sheet = 'signin-apply' | 'signin-message' | 'apply' | 'message' | 'withdraw' | null;

/** Withdrawn applications read as "not applied". */
function isLive(application: Application | null): application is Application {
  return Boolean(application && application.stage !== 'WITHDRAWN');
}

export function JobApplyActions({ job }: { job: Job }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, signedIn } = useSession();

  const [application, setApplication] = useState<Application | null>(null);
  const [checked, setChecked] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [busy, setBusy] = useState(false);

  const isWorker = user?.role === 'WORKER';
  const isOwnJob = user?.id === job.employer.id;

  /**
   * Load what this viewer can do, then resume any interrupted intent — in that order,
   * since whether the sheet should reopen depends on whether they already applied.
   *
   * The intent comes from `window.location`, not `useSearchParams`: this page is
   * prerendered, and reading search params during render would opt the tree out of that
   * for a parameter only present on a return trip.
   */
  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    void (async () => {
      let existing: Application | null = null;
      if (signedIn && isWorker) {
        try {
          existing = await getMyApplicationForJob(job.id);
        } catch {
          // A failed check must not block applying; the server refuses a duplicate anyway.
        }
      }
      if (cancelled) return;

      setApplication(existing);
      setChecked(true);

      if (!signedIn || !isWorker) return;

      const params = new URLSearchParams(window.location.search);
      const intent = params.get('intent');
      if (intent !== 'apply' && intent !== 'message') return;

      // Consume it, so a refresh does not reopen the sheet.
      params.delete('intent');
      const query = params.toString();
      window.history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : ''));

      if (intent === 'message') setSheet('message');
      else if (!isLive(existing)) setSheet('apply');
    })();

    return () => {
      cancelled = true;
    };
  }, [job.id, loading, signedIn, isWorker]);

  /** Sign in, come back here, reopen whatever they pressed. */
  const continueHref = useCallback(
    (intent: 'apply' | 'message', kind: 'login' | 'register') =>
      kind === 'login'
        ? routes.loginToContinue(pathname, intent)
        : routes.registerToContinue('worker', pathname, intent),
    [pathname],
  );

  function guard(intent: 'apply' | 'message'): boolean {
    if (loading) return false;
    if (!signedIn) {
      setSheet(intent === 'apply' ? 'signin-apply' : 'signin-message');
      return false;
    }
    return true;
  }

  async function submitApply(input: {
    coverNote?: string;
    expectedAmount?: number;
    phone?: string;
  }): Promise<void> {
    setBusy(true);
    try {
      const saved = await applyToJob(job.id, {
        ...(input.coverNote ? { coverNote: input.coverNote } : {}),
        ...(input.expectedAmount
          ? {
              expectedWage: {
                amount: input.expectedAmount,
                type: job.salary.type,
                negotiable: true,
              },
            }
          : {}),
        ...(input.phone ? { phone: input.phone } : {}),
      });

      setApplication(saved);
      setSheet(null);
      toast.success('Application sent', {
        description: `${job.company.name} can see your profile now.`,
        action: { label: 'My applications', onClick: () => router.push(routes.w.applications) },
      });
    } catch (error) {
      toast.error(applyErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function submitMessage(text: string): Promise<void> {
    setBusy(true);
    try {
      const { conversation } = await startConversation({ job: job.id, text });
      setSheet(null);
      toast.success('Message sent', {
        description: `${job.company.name} will see it in their inbox.`,
        action: {
          label: 'Open',
          onClick: () => router.push(routes.w.conversation(conversation.id)),
        },
      });
    } catch (error) {
      toast.error(
        error instanceof ApiClientError ? error.message : 'Could not send your message.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitWithdraw(): Promise<void> {
    if (!application) return;
    setBusy(true);
    try {
      setApplication(await withdrawApplication(application.id));
      setSheet(null);
      toast.success('Application withdrawn', {
        description: 'You can apply again while the job is open.',
      });
    } catch (error) {
      toast.error(
        error instanceof ApiClientError ? error.message : 'Could not withdraw your application.',
      );
    } finally {
      setBusy(false);
    }
  }

  /* ------------------------------------------------------------------ render */

  // An employer cannot apply, to their own job or anyone else's.
  if (!loading && signedIn && !isWorker) {
    return (
      <div className="bg-muted rounded-md p-3 text-center text-sm">
        <p className="font-medium">
          {isOwnJob ? 'This is your job posting' : 'Employer accounts cannot apply'}
        </p>
        {isOwnJob ? (
          <Button asChild variant="outline" size="sm" className="mt-3 w-full">
            <Link href={routes.e.jobApplicants(job.slug)}>See who applied</Link>
          </Button>
        ) : null}
      </div>
    );
  }

  const applied = isLive(application);

  return (
    <>
      <div className="grid gap-2">
        {applied ? (
          <div className="border-success/30 bg-success-subtle rounded-md border p-3">
            <p className="flex items-center gap-2 text-sm font-medium">
              <BadgeCheck className="text-success size-4" aria-hidden />
              You applied for this job
            </p>
            <div className="mt-2 flex items-center gap-2">
              <StageBadge stage={application.stage} />
              <span className="text-muted-foreground text-xs">
                {APPLICATION_STAGE_LABEL[application.stage]} · your profile is with the employer
              </span>
            </div>
          </div>
        ) : (
          <Button
            variant="action"
            size="lg"
            className="w-full"
            disabled={loading || busy}
            onClick={() => {
              if (guard('apply')) setSheet('apply');
            }}
          >
            {loading || (signedIn && isWorker && !checked) ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : null}
            Apply for this job
          </Button>
        )}

        <Button
          variant={applied ? 'action' : 'outline'}
          size={applied ? 'lg' : 'default'}
          className="w-full"
          disabled={busy}
          onClick={() => {
            if (guard('message')) setSheet('message');
          }}
        >
          <MessageSquare aria-hidden />
          Message the employer
        </Button>

        {applied && !['HIRED', 'REJECTED'].includes(application.stage) ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive w-full"
            disabled={busy}
            onClick={() => setSheet('withdraw')}
          >
            Withdraw application
          </Button>
        ) : null}
      </div>

      <SignInSheet
        open={sheet === 'signin-apply' || sheet === 'signin-message'}
        onOpenChange={(open) => setSheet(open ? sheet : null)}
        intent={sheet === 'signin-message' ? 'message' : 'apply'}
        job={job}
        continueHref={continueHref}
      />

      <ApplySheet
        open={sheet === 'apply'}
        onOpenChange={(open) => setSheet(open ? 'apply' : null)}
        job={job}
        busy={busy}
        needsPhone={Boolean(user && !user.phone)}
        onSubmit={submitApply}
      />

      <MessageSheet
        open={sheet === 'message'}
        onOpenChange={(open) => setSheet(open ? 'message' : null)}
        job={job}
        busy={busy}
        onSubmit={submitMessage}
      />

      <WithdrawSheet
        open={sheet === 'withdraw'}
        onOpenChange={(open) => setSheet(open ? 'withdraw' : null)}
        job={job}
        busy={busy}
        onConfirm={submitWithdraw}
      />
    </>
  );
}

/** Business-rule codes, worded for a worker. */
function applyErrorMessage(error: unknown): string {
  if (!(error instanceof ApiClientError)) return 'Could not send your application.';

  switch (error.code) {
    case 'JOB_NOT_OPEN':
      return 'This job has stopped accepting applications.';
    case 'VACANCIES_FULL':
      return 'Every position on this job has been filled.';
    case 'DUPLICATE_APPLICATION':
      return 'You have already applied to this job.';
    case 'ACCOUNT_SUSPENDED':
      return 'This account cannot apply for work. Contact support.';
    default:
      return error.message || 'Could not send your application.';
  }
}

/* ------------------------------------------------------------------- sheets */

function SignInSheet({
  open,
  onOpenChange,
  intent,
  job,
  continueHref,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intent: 'apply' | 'message';
  job: Job;
  continueHref: (intent: 'apply' | 'message', kind: 'login' | 'register') => string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {intent === 'apply' ? 'Sign in to apply' : 'Sign in to send a message'}
          </DialogTitle>
          <DialogDescription>
            {intent === 'apply'
              ? `Your account is your application — ${job.company.name} sees your profile, skills and location. You will come straight back here.`
              : `You need an account so ${job.company.name} can reply to you. You will come straight back here.`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Button asChild variant="action" size="lg">
            <Link href={continueHref(intent, 'register')}>Create a free worker account</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={continueHref(intent, 'login')}>
              <LogIn aria-hidden />
              I already have an account
            </Link>
          </Button>
        </div>

        <p className="text-muted-foreground text-xs leading-relaxed">
          Free for workers, always. Your phone number stays hidden until you choose to share
          it.
        </p>
      </DialogContent>
    </Dialog>
  );
}

function ApplySheet({
  open,
  onOpenChange,
  job,
  busy,
  needsPhone,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job;
  busy: boolean;
  needsPhone: boolean;
  onSubmit: (input: {
    coverNote?: string;
    expectedAmount?: number;
    phone?: string;
  }) => Promise<void>;
}) {
  const [coverNote, setCoverNote] = useState('');
  const [expected, setExpected] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  function submit(event: React.FormEvent): void {
    event.preventDefault();

    const digits = phone.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '');
    if (needsPhone && digits && !/^[6-9]\d{9}$/.test(digits)) {
      setPhoneError('Enter a valid 10-digit mobile number');
      return;
    }
    setPhoneError(null);

    const amount = Number.parseInt(expected, 10);
    void onSubmit({
      ...(coverNote.trim() ? { coverNote: coverNote.trim() } : {}),
      ...(Number.isFinite(amount) && amount > 0 ? { expectedAmount: amount } : {}),
      ...(needsPhone && digits ? { phone: digits } : {}),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply — {job.title}</DialogTitle>
          <DialogDescription>
            {job.company.name} · {job.location.locality ?? job.location.city} ·{' '}
            <span data-numeric>
              {formatRupees(job.salary.amount)} {SALARY_TYPE_LABEL[job.salary.type]}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <p className="bg-muted text-muted-foreground rounded-md p-3 text-sm">
            Your profile is sent with this application. Everything below is optional — send
            it as it is if you are in a hurry.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="cover-note">Anything you want to add?</Label>
            <Textarea
              id="cover-note"
              value={coverNote}
              onChange={(event) => setCoverNote(event.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="For example: I have done this work at three sites nearby and can start tomorrow."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expected-wage">
              Your rate ({SALARY_TYPE_LABEL[job.salary.type]})
            </Label>
            <Input
              id="expected-wage"
              type="number"
              inputMode="numeric"
              min={50}
              value={expected}
              onChange={(event) => setExpected(event.target.value)}
              placeholder={String(job.salary.amount)}
            />
            <p className="text-muted-foreground text-xs">
              Leave it blank to accept the rate the employer posted.
            </p>
          </div>

          {needsPhone ? (
            <div className="space-y-1.5">
              <Label htmlFor="apply-phone">Mobile number</Label>
              <Input
                id="apply-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="98765 43210"
                aria-invalid={Boolean(phoneError)}
              />
              {phoneError ? (
                <p className="text-destructive text-sm">{phoneError}</p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Saved to your account. It stays hidden until you share it in a message.
                </p>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button type="submit" variant="action" size="lg" disabled={busy} className="w-full">
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
              Send application
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MessageSheet({
  open,
  onOpenChange,
  job,
  busy,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job;
  busy: boolean;
  onSubmit: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Message {job.company.name}</DialogTitle>
          <DialogDescription>
            About “{job.title}”. Replies arrive in your messages — neither side sees the
            other&apos;s phone number.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (text.trim()) void onSubmit(text.trim());
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="employer-message">Your message</Label>
            <Textarea
              id="employer-message"
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Ask about the timings, the site, or how long the work will run."
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              variant="action"
              size="lg"
              className="w-full"
              disabled={busy || !text.trim()}
            >
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
              Send message
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WithdrawSheet({
  open,
  onOpenChange,
  job,
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job;
  busy: boolean;
  onConfirm: () => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw your application?</DialogTitle>
          <DialogDescription>
            {job.company.name} will see that you pulled out of “{job.title}”. You can apply
            again while the job is still open.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Keep it
          </Button>
          <Button variant="destructive" onClick={() => void onConfirm()} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Withdraw
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
