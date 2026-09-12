'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { LANGUAGES } from '@rokdajob/shared';
import type { SeedCity, WorkerProfile } from '@rokdajob/shared';
import { Loader2, Save } from 'lucide-react';
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
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

/**
 * Mirrors what `PATCH /workers/me/profile` will accept. The schema lives here for now and
 * moves to `@rokdajob/shared` once the endpoint exists, so client and server validate the
 * same rules.
 */
const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name'),
  headline: z.string().trim().max(90, 'Keep this under 90 characters').optional(),
  bio: z.string().trim().max(1000).optional(),
  citySlug: z.string().min(1, 'Choose your city'),
  localitySlug: z.string().optional(),
  workRadiusKm: z.number().min(1).max(100),
  wageAmount: z.coerce.number().int().min(50, 'That looks too low').max(1_000_000),
  wageType: z.enum(['PER_DAY', 'PER_HOUR', 'PER_MONTH', 'PER_PIECE']),
  negotiable: z.boolean(),
  availability: z.enum(['AVAILABLE_NOW', 'AVAILABLE_FROM', 'BUSY', 'NOT_LOOKING']),
  languages: z.array(z.string()).min(1, 'Choose at least one language'),
});

type ProfileValues = z.infer<typeof profileSchema>;

export function WorkerProfileForm({
  worker,
  cities,
}: {
  worker: WorkerProfile;
  cities: readonly SeedCity[];
}) {
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: worker.user.name,
      headline: worker.headline ?? '',
      bio: worker.bio ?? '',
      citySlug: worker.location.citySlug,
      localitySlug: worker.location.localitySlug ?? '',
      workRadiusKm: worker.workRadiusKm,
      wageAmount: worker.expectedWage.amount,
      wageType: worker.expectedWage.type,
      negotiable: worker.expectedWage.negotiable,
      availability: worker.availability,
      languages: worker.languages,
    },
  });

  // useWatch keeps this subscription memo-safe for the React Compiler; watch() is not.
  const citySlug = useWatch({ control, name: 'citySlug' });
  const languages = useWatch({ control, name: 'languages' });
  const localities = cities.find((city) => city.slug === citySlug)?.localities ?? [];

  async function onSubmit(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSaved(true);
    toast.success('Profile saved locally', {
      description: 'The profile API is not connected yet, so this change is not persisted.',
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <section className="bg-card space-y-4 rounded-lg border p-5">
        <h2 className="font-semibold">Basics</h2>

        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" {...register('name')} aria-invalid={Boolean(errors.name)} />
          {errors.name ? <p className="text-destructive text-sm">{errors.name.message}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="headline">One line about your work</Label>
          <Input
            id="headline"
            {...register('headline')}
            placeholder="Mason with 8 years on residential towers"
          />
          <p className="text-muted-foreground text-xs">
            This is the first thing an employer reads. Say your trade and your experience.
          </p>
          {errors.headline ? (
            <p className="text-destructive text-sm">{errors.headline.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">About your work</Label>
          <Textarea
            id="bio"
            rows={4}
            {...register('bio')}
            placeholder="What kind of sites have you worked on? What tools do you have? Can you lead a team?"
          />
        </div>
      </section>

      <section className="bg-card space-y-4 rounded-lg border p-5">
        <h2 className="font-semibold">Where you work</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
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
                  <SelectTrigger id="city" className="w-full">
                    <SelectValue placeholder="Choose your city" />
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
            {errors.citySlug ? (
              <p className="text-destructive text-sm">{errors.citySlug.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="locality">Area</Label>
            <Controller
              control={control}
              name="localitySlug"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger id="locality" className="w-full">
                    <SelectValue placeholder="Choose your area" />
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
            <p className="text-muted-foreground text-xs">
              Distance to every job is measured from here.
            </p>
          </div>
        </div>

        <Controller
          control={control}
          name="workRadiusKm"
          render={({ field }) => (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label htmlFor="radius">How far will you travel?</Label>
                <span className="text-sm font-medium" data-numeric>
                  {field.value} km
                </span>
              </div>
              <Slider
                id="radius"
                min={5}
                max={100}
                step={5}
                value={[field.value]}
                onValueChange={([value]) => field.onChange(value ?? 5)}
              />
              <p className="text-muted-foreground mt-2 text-xs">
                Jobs outside this distance are not shown to you at all.
              </p>
            </div>
          )}
        />
      </section>

      <section className="bg-card space-y-4 rounded-lg border p-5">
        <h2 className="font-semibold">Pay and availability</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="wageAmount">Expected wage (₹)</Label>
            <Input
              id="wageAmount"
              inputMode="numeric"
              {...register('wageAmount')}
              aria-invalid={Boolean(errors.wageAmount)}
            />
            {errors.wageAmount ? (
              <p className="text-destructive text-sm">{errors.wageAmount.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wageType">Paid</Label>
            <Controller
              control={control}
              name="wageType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="wageType" className="w-full">
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
          </div>
        </div>

        <Controller
          control={control}
          name="negotiable"
          render={({ field }) => (
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="negotiable">Rate is negotiable</Label>
                <p className="text-muted-foreground text-xs">
                  Employers are more likely to contact you if the rate can be discussed.
                </p>
              </div>
              <Switch id="negotiable" checked={field.value} onCheckedChange={field.onChange} />
            </div>
          )}
        />

        <div className="space-y-1.5">
          <Label htmlFor="availability">Are you available?</Label>
          <Controller
            control={control}
            name="availability"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="availability" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE_NOW">Available now</SelectItem>
                  <SelectItem value="AVAILABLE_FROM">Available from a date</SelectItem>
                  <SelectItem value="BUSY">Currently working</SelectItem>
                  <SelectItem value="NOT_LOOKING">Not looking for work</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </section>

      <section className="bg-card space-y-3 rounded-lg border p-5">
        <h2 className="font-semibold">Languages you speak</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {LANGUAGES.slice(0, 12).map((language) => {
            const checked = languages.includes(language);
            return (
              <div key={language} className="flex items-center gap-2.5">
                <Checkbox
                  id={`lang-${language}`}
                  checked={checked}
                  onCheckedChange={() =>
                    setValue(
                      'languages',
                      checked
                        ? languages.filter((item) => item !== language)
                        : [...languages, language],
                      { shouldDirty: true, shouldValidate: true },
                    )
                  }
                />
                <Label htmlFor={`lang-${language}`} className="cursor-pointer font-normal">
                  {language}
                </Label>
              </div>
            );
          })}
        </div>
        {errors.languages ? (
          <p className="text-destructive text-sm">{errors.languages.message}</p>
        ) : null}
      </section>

      <div className="bg-background/95 sticky bottom-16 flex items-center gap-3 border-t py-3 backdrop-blur md:bottom-0">
        <Button type="submit" variant="action" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          {isSubmitting ? 'Saving…' : 'Save profile'}
        </Button>
        {saved && !isDirty ? (
          <span className="text-success text-sm">Saved</span>
        ) : (
          <span className="text-muted-foreground text-sm">
            Changes are not persisted until the API is connected.
          </span>
        )}
      </div>
    </form>
  );
}
