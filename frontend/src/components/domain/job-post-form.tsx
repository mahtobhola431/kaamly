'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { LIMITS } from '@rokdajob/shared';
import type { Category, SeedCity, Skill } from '@rokdajob/shared';
import { Check, Eye, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

/**
 * Job posting form.
 *
 * The schema mirrors what `POST /jobs` will accept, including the vacancy and salary rules,
 * so the same validation moves to `@rokdajob/shared` when the endpoint lands.
 *
 * Gender and age fields are deliberately absent: they are gated behind
 * FEATURE_GENDER_AGE_FILTERS on the server and carry legal exposure (docs/06-RISKS.md R9).
 */
const jobSchema = z
  .object({
    title: z.string().trim().min(8, 'Say what you need — e.g. "Need 15 construction helpers"'),
    categorySlug: z.string().min(1, 'Choose a category'),
    skills: z.array(z.string()).min(1, 'Choose at least one skill'),
    description: z
      .string()
      .trim()
      .min(40, 'Describe the work in a few lines so workers know what to expect')
      .max(LIMITS.jobDescriptionMaxLength),
    workersRequired: z.coerce.number().int().min(1).max(LIMITS.maxWorkersPerJob),
    citySlug: z.string().min(1, 'Choose the city'),
    localitySlug: z.string().optional(),
    startDate: z.string().min(1, 'When does the work start?'),
    durationDays: z.coerce.number().int().min(1).max(3650),
    shift: z.enum(['DAY', 'NIGHT', 'ROTATIONAL', 'FLEXIBLE']),
    hoursFrom: z.string().min(1),
    hoursTo: z.string().min(1),
    salaryAmount: z.coerce.number().int().min(50, 'That rate looks too low'),
    salaryType: z.enum(['PER_DAY', 'PER_HOUR', 'PER_MONTH', 'PER_PIECE']),
    negotiable: z.boolean(),
    accommodation: z.boolean(),
    food: z.boolean(),
    transport: z.boolean(),
    experienceRequiredYears: z.coerce.number().int().min(0).max(40),
    urgency: z.enum(['NORMAL', 'URGENT', 'IMMEDIATE']),
    contactPreference: z.enum(['IN_APP', 'PHONE', 'BOTH']),
  })
  .refine((value) => value.hoursFrom !== value.hoursTo, {
    message: 'Start and end time cannot be the same',
    path: ['hoursTo'],
  });

type JobValues = z.infer<typeof jobSchema>;

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}

export function JobPostForm({
  cities,
  categories,
  skills,
}: {
  cities: readonly SeedCity[];
  categories: Category[];
  skills: Skill[];
}) {
  const [savedAs, setSavedAs] = useState<'draft' | 'published' | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<JobValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      categorySlug: '',
      skills: [],
      description: '',
      workersRequired: 1,
      citySlug: '',
      localitySlug: '',
      startDate: '',
      durationDays: 15,
      shift: 'DAY',
      hoursFrom: '08:00',
      hoursTo: '18:00',
      salaryAmount: 800,
      salaryType: 'PER_DAY',
      negotiable: false,
      accommodation: false,
      food: false,
      transport: false,
      experienceRequiredYears: 0,
      urgency: 'NORMAL',
      contactPreference: 'IN_APP',
    },
  });

  const categorySlug = useWatch({ control, name: 'categorySlug' });
  const citySlug = useWatch({ control, name: 'citySlug' });
  const chosenSkills = useWatch({ control, name: 'skills' });

  const localities = cities.find((city) => city.slug === citySlug)?.localities ?? [];
  const categorySkills = skills.filter((skill) => skill.category.slug === categorySlug);

  async function submit(mode: 'draft' | 'published'): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSavedAs(mode);
    toast.success(mode === 'draft' ? 'Saved as draft' : 'Job ready to publish', {
      description: 'The jobs API is not connected yet, so nothing was created.',
    });
  }

  return (
    <form onSubmit={handleSubmit(() => submit('published'))} noValidate className="space-y-6">
      <section className="bg-card space-y-4 rounded-lg border p-5">
        <h2 className="font-semibold">What do you need?</h2>

        <Field
          label="Job title"
          htmlFor="title"
          hint="Write it the way you would say it: “Need 15 construction helpers”."
          error={errors.title?.message}
        >
          <Input id="title" {...register('title')} aria-invalid={Boolean(errors.title)} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Work category" htmlFor="category" error={errors.categorySlug?.message}>
            <Controller
              control={control}
              name="categorySlug"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setValue('skills', []);
                  }}
                >
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.slug} value={category.slug}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field
            label="How many workers?"
            htmlFor="workersRequired"
            error={errors.workersRequired?.message}
          >
            <Input
              id="workersRequired"
              inputMode="numeric"
              {...register('workersRequired')}
              aria-invalid={Boolean(errors.workersRequired)}
            />
          </Field>
        </div>

        {categorySlug ? (
          <div className="space-y-1.5">
            <Label>Skills needed</Label>
            <div className="flex flex-wrap gap-2">
              {categorySkills.map((skill) => {
                const selected = chosenSkills.includes(skill.slug);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setValue(
                        'skills',
                        selected
                          ? chosenSkills.filter((item) => item !== skill.slug)
                          : [...chosenSkills, skill.slug],
                        { shouldValidate: true },
                      )
                    }
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors',
                      selected
                        ? 'border-success/40 bg-success-subtle text-success'
                        : 'hover:border-action/50',
                    )}
                  >
                    {selected ? <Check className="size-3.5" aria-hidden /> : null}
                    {skill.name}
                  </button>
                );
              })}
            </div>
            {errors.skills ? (
              <p className="text-destructive text-sm">{errors.skills.message}</p>
            ) : null}
          </div>
        ) : null}

        <Field
          label="Describe the work"
          htmlFor="description"
          hint="Site conditions, what the day looks like, payment schedule. Vague posts get vague applicants."
          error={errors.description?.message}
        >
          <Textarea
            id="description"
            rows={6}
            {...register('description')}
            aria-invalid={Boolean(errors.description)}
          />
        </Field>
      </section>

      <section className="bg-card space-y-4 rounded-lg border p-5">
        <h2 className="font-semibold">Where and when</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" htmlFor="job-city" error={errors.citySlug?.message}>
            <Controller
              control={control}
              name="citySlug"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setValue('localitySlug', '');
                  }}
                >
                  <SelectTrigger id="job-city" className="w-full">
                    <SelectValue placeholder="Choose the city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.slug} value={city.slug}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field
            label="Area or site"
            htmlFor="job-locality"
            hint="Workers see the distance from here to where they live."
          >
            <Controller
              control={control}
              name="localitySlug"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger id="job-locality" className="w-full">
                    <SelectValue placeholder="Choose the area" />
                  </SelectTrigger>
                  <SelectContent>
                    {localities.map((locality) => (
                      <SelectItem key={locality.slug} value={locality.slug}>
                        {locality.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Start date" htmlFor="startDate" error={errors.startDate?.message}>
            <Input
              id="startDate"
              type="date"
              {...register('startDate')}
              aria-invalid={Boolean(errors.startDate)}
            />
          </Field>

          <Field
            label="Duration (days)"
            htmlFor="durationDays"
            error={errors.durationDays?.message}
          >
            <Input id="durationDays" inputMode="numeric" {...register('durationDays')} />
          </Field>

          <Field label="Shift" htmlFor="shift">
            <Controller
              control={control}
              name="shift"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="shift" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAY">Day shift</SelectItem>
                    <SelectItem value="NIGHT">Night shift</SelectItem>
                    <SelectItem value="ROTATIONAL">Rotational</SelectItem>
                    <SelectItem value="FLEXIBLE">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="From" htmlFor="hoursFrom">
              <Input id="hoursFrom" type="time" {...register('hoursFrom')} />
            </Field>
            <Field label="To" htmlFor="hoursTo" error={errors.hoursTo?.message}>
              <Input id="hoursTo" type="time" {...register('hoursTo')} />
            </Field>
          </div>
        </div>
      </section>

      <section className="bg-card space-y-4 rounded-lg border p-5">
        <h2 className="font-semibold">Pay and conditions</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rate (₹)" htmlFor="salaryAmount" error={errors.salaryAmount?.message}>
            <Input
              id="salaryAmount"
              inputMode="numeric"
              {...register('salaryAmount')}
              aria-invalid={Boolean(errors.salaryAmount)}
            />
          </Field>

          <Field label="Paid" htmlFor="salaryType">
            <Controller
              control={control}
              name="salaryType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="salaryType" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PER_DAY">Per day</SelectItem>
                    <SelectItem value="PER_HOUR">Per hour</SelectItem>
                    <SelectItem value="PER_MONTH">Per month</SelectItem>
                    <SelectItem value="PER_PIECE">Per piece</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>

        <Controller
          control={control}
          name="negotiable"
          render={({ field }) => (
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="negotiable">Rate is negotiable</Label>
              <Switch id="negotiable" checked={field.value} onCheckedChange={field.onChange} />
            </div>
          )}
        />

        <div>
          <Label className="mb-2 block">What do you provide?</Label>
          <div className="flex flex-wrap gap-4">
            {(
              [
                ['accommodation', 'Accommodation'],
                ['food', 'Food'],
                ['transport', 'Transport'],
              ] as const
            ).map(([name, label]) => (
              <Controller
                key={name}
                control={control}
                name={name}
                render={({ field }) => (
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      id={name}
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                    <Label htmlFor={name} className="cursor-pointer font-normal">
                      {label}
                    </Label>
                  </div>
                )}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Experience required (years)"
            htmlFor="experienceRequiredYears"
            hint="Set 0 if you will train on site — it widens the pool a lot."
          >
            <Input
              id="experienceRequiredYears"
              inputMode="numeric"
              {...register('experienceRequiredYears')}
            />
          </Field>

          <Field label="How urgent is this?" htmlFor="urgency">
            <Controller
              control={control}
              name="urgency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="urgency" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                    <SelectItem value="IMMEDIATE">Need people immediately</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>

        <Field
          label="How should workers reach you?"
          htmlFor="contactPreference"
          hint="In-app keeps your number private until you choose to share it."
        >
          <Controller
            control={control}
            name="contactPreference"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="contactPreference" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_APP">In-app messages only</SelectItem>
                  <SelectItem value="PHONE">Phone calls</SelectItem>
                  <SelectItem value="BOTH">Both</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <p className="text-muted-foreground border-t pt-4 text-xs leading-relaxed">
          Gender and age requirements are not available on job posts. They carry legal exposure and
          are gated behind a server feature flag that is off by default.
        </p>
      </section>

      <div className="bg-background/95 sticky bottom-0 flex flex-wrap items-center gap-3 border-t py-3 backdrop-blur">
        <Button type="submit" variant="action" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
          Publish job
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => void submit('draft')}
        >
          Save as draft
        </Button>
        <Button type="button" variant="ghost" disabled>
          <Eye aria-hidden />
          Preview
        </Button>

        {savedAs ? (
          <span className="text-success text-sm">
            {savedAs === 'draft' ? 'Draft saved locally' : 'Ready to publish'}
          </span>
        ) : null}
      </div>
    </form>
  );
}
