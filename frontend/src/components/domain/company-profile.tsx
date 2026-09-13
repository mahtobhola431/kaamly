'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import type { Company, CompanyType } from '@rokdajob/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Building2, Camera, Loader2, MapPin, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { RatingStars } from '@/components/domain/rating-stars';
import { ErrorState } from '@/components/feedback/error-state';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ApiClientError } from '@/lib/api/client';
import {
  getMyCompany,
  getMyEmployerProfile,
  updateMyCompany,
  uploadCompanyLogo,
} from '@/lib/data/company';
import { routes } from '@/lib/routes';

/**
 * The contractor's own company, read from and written to `/employer/company`.
 *
 * Not editable here: the verification badges, which an admin grants, and the rating, which
 * comes from completed work.
 */

const COMPANY_TYPES: { value: CompanyType; label: string }[] = [
  { value: 'CONTRACTOR', label: 'Contractor' },
  { value: 'CONSTRUCTION', label: 'Construction' },
  { value: 'WAREHOUSE', label: 'Warehouse' },
  { value: 'FACTORY', label: 'Factory' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'SMALL_BUSINESS', label: 'Small business' },
  { value: 'PROPERTY', label: 'Property' },
  { value: 'SERVICE_PROVIDER', label: 'Service provider' },
  { value: 'OTHER', label: 'Other' },
];

const SIZES = ['1-10 workers', '10-50 workers', '50-200 workers', '200-500 workers', '500+ workers'];

function typeLabel(type: CompanyType): string {
  return COMPANY_TYPES.find((entry) => entry.value === type)?.label ?? type;
}

export function CompanyProfile() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const company = useQuery({ queryKey: ['my-company'], queryFn: getMyCompany });
  const profile = useQuery({ queryKey: ['my-employer-profile'], queryFn: getMyEmployerProfile });

  const logo = useMutation({
    mutationFn: uploadCompanyLogo,
    onSuccess: async (updated) => {
      queryClient.setQueryData(['my-company'], updated);
      await queryClient.invalidateQueries({ queryKey: ['my-employer-profile'] });
      toast.success('Logo updated');
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : 'Could not upload that image.');
    },
  });

  if (company.isPending) {
    return (
      <div className="mt-5 space-y-4">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (company.isError) {
    return (
      <div className="mt-5">
        <ErrorState
          title="Could not load your company"
          description="Check your connection and try again."
          onRetry={() => void company.refetch()}
        />
      </div>
    );
  }

  const data = company.data;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-xl font-bold sm:text-2xl">Company profile</h1>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          <Pencil aria-hidden />
          Edit
        </Button>
      </div>

      <section className="bg-card mt-5 rounded-lg border p-5">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            {data.logoUrl ? (
              // Already resized on upload and CDN-served; next/image would only proxy it.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.logoUrl}
                alt=""
                className="size-14 rounded-md border object-contain"
              />
            ) : (
              <span className="bg-primary text-primary-foreground flex size-14 items-center justify-center rounded-md text-lg font-bold">
                {data.name.slice(0, 2).toUpperCase()}
              </span>
            )}

            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={logo.isPending}
              className="bg-background hover:bg-accent absolute -bottom-1.5 -right-1.5 rounded-full border p-1.5 shadow-sm"
              aria-label="Upload a company logo"
            >
              {logo.isPending ? (
                <Loader2 className="size-3 animate-spin" aria-hidden />
              ) : (
                <Camera className="size-3" aria-hidden />
              )}
            </button>

            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                // Reset first, so re-choosing the same file still fires a change.
                event.target.value = '';
                if (file) logo.mutate(file);
              }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold">{data.name}</h2>
              {data.verification.company ? (
                <Badge variant="success" className="gap-1">
                  <BadgeCheck aria-hidden />
                  Verified
                </Badge>
              ) : (
                <Badge variant="muted">Verification pending</Badge>
              )}
            </div>

            <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 text-sm">
              <span className="inline-flex items-center gap-1">
                <Building2 className="size-3.5" aria-hidden />
                {typeLabel(data.type)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden />
                {data.location?.formatted ?? 'No location set'}
              </span>
            </p>

            <div className="mt-2">
              {data.ratingCount > 0 ? (
                <RatingStars rating={data.ratingAvg} count={data.ratingCount} size="sm" />
              ) : (
                <p className="text-muted-foreground text-sm">
                  No reviews yet — workers rate you after a completed job.
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {data.about ? (
          <p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
            {data.about}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm italic">
            No description yet. Workers read this before applying — a couple of lines about
            the sites you run and how you pay goes a long way.
          </p>
        )}

        <Separator className="my-4" />

        <dl className="grid gap-4 sm:grid-cols-3">
          {[
            ['Workforce size', data.size ?? '—'],
            ['Founded', data.foundedYear ? String(data.foundedYear) : '—'],
            ['Live jobs', String(data.activeJobCount ?? 0)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-muted-foreground text-xs">{label}</dt>
              <dd className="mt-0.5 font-medium" data-numeric>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-card mt-4 rounded-lg border p-5">
        <h2 className="font-semibold">Verification</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Verified companies appear with a badge on every job post, and workers apply to them
          noticeably more often.
        </p>

        <ul className="mt-4 space-y-3">
          {[
            {
              label: 'Business details reviewed',
              done: data.verification.company,
              help: 'Our team confirms the company name, type and location.',
            },
            {
              label: 'GSTIN verified',
              done: data.verification.gstin,
              help: 'Adds a stronger trust signal for larger hires.',
            },
          ].map((item) => (
            <li key={item.label} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-muted-foreground text-xs">{item.help}</p>
              </div>
              <Badge variant={item.done ? 'success' : 'muted'}>
                {item.done ? 'Verified' : 'Not submitted'}
              </Badge>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-card mt-4 rounded-lg border p-5">
        <h2 className="font-semibold">Who posts on behalf of this company</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          {profile.data ? (
            <>
              {profile.data.user.name}
              {profile.data.designation ? ` · ${profile.data.designation}` : ''}
            </>
          ) : (
            'Loading…'
          )}
        </p>
        <Button asChild variant="ghost" size="sm" className="mt-2 px-0">
          <Link href={routes.e.settings}>Manage team access</Link>
        </Button>
      </section>

      <EditCompanyDialog
        open={editing}
        onOpenChange={setEditing}
        company={data}
        onSaved={(updated) => {
          queryClient.setQueryData(['my-company'], updated);
          void queryClient.invalidateQueries({ queryKey: ['my-employer-profile'] });
          setEditing(false);
        }}
      />
    </>
  );
}

function EditCompanyDialog({
  open,
  onOpenChange,
  company,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company;
  onSaved: (company: Company) => void;
}) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: updateMyCompany,
    onSuccess: (updated) => {
      setFieldErrors({});
      toast.success('Company profile saved');
      onSaved(updated);
    },
    onError: (error) => {
      if (error instanceof ApiClientError) {
        const fields = error.fieldErrors();
        setFieldErrors(fields);
        if (Object.keys(fields).length === 0) toast.error(error.message);
        return;
      }
      toast.error('Could not save your changes.');
    },
  });

  function submit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string): string => String(form.get(key) ?? '').trim();

    const year = text('foundedYear');
    save.mutate({
      name: text('name'),
      type: text('type') as CompanyType,
      about: text('about'),
      size: text('size'),
      gstin: text('gstin'),
      foundedYear: year ? Number(year) : null,
      ...(text('pincode') ? { pincode: text('pincode') } : {}),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit company profile</DialogTitle>
          <DialogDescription>
            This is what a worker sees before they apply to one of your jobs.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Company name" name="name" error={fieldErrors.name}>
            <Input id="name" name="name" defaultValue={company.name} required />
          </Field>

          <div className="space-y-1.5">
            <Label htmlFor="type">Business type</Label>
            <Select name="type" defaultValue={company.type}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_TYPES.map((entry) => (
                  <SelectItem key={entry.value} value={entry.value}>
                    {entry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Field
            label="About"
            name="about"
            error={fieldErrors.about}
            help="The sites you run, how you pay, whether you provide food or accommodation."
          >
            <Textarea id="about" name="about" defaultValue={company.about ?? ''} rows={4} maxLength={2000} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="size">Workforce size</Label>
              <Select name="size" defaultValue={company.size ?? ''}>
                <SelectTrigger id="size">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {SIZES.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Field label="Founded" name="foundedYear" error={fieldErrors.foundedYear}>
              <Input
                id="foundedYear"
                name="foundedYear"
                type="number"
                inputMode="numeric"
                min={1800}
                max={new Date().getFullYear()}
                defaultValue={company.foundedYear ?? ''}
                placeholder="2011"
              />
            </Field>
          </div>

          <Field
            label="Site pincode"
            name="pincode"
            error={fieldErrors.pincode}
            help={
              company.location
                ? `Currently ${company.location.formatted}. Enter a pincode to move it.`
                : 'Sets where your company is based. Leave blank to skip for now.'
            }
          >
            <Input
              id="pincode"
              name="pincode"
              inputMode="numeric"
              maxLength={6}
              defaultValue=""
              placeholder={company.location?.pincode ?? '400069'}
            />
          </Field>

          <Field
            label="GSTIN"
            name="gstin"
            error={fieldErrors.gstin}
            help="Optional. Changing it clears the verified badge until an admin checks the new number."
          >
            <Input
              id="gstin"
              name="gstin"
              maxLength={15}
              defaultValue={company.gstin ?? ''}
              placeholder="27ABCDE1234F1Z5"
              className="uppercase"
            />
          </Field>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={save.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="action" disabled={save.isPending}>
              {save.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  name,
  error,
  help,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : help ? (
        <p className="text-muted-foreground text-xs">{help}</p>
      ) : null}
    </div>
  );
}
