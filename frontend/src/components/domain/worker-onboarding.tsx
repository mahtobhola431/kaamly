'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LANGUAGES } from '@rokdajob/shared';
import type { Category, SeedCity, Skill } from '@rokdajob/shared';
import { ArrowLeft, ArrowRight, Check, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

/**
 * Five steps, one decision per screen.
 *
 * Onboarding is where most workers drop out, so nothing here is optional-looking, nothing
 * asks for typing that can be a tap, and the whole flow works with a thumb.
 */
const STEPS = ['You', 'Skills', 'Area', 'Pay', 'Review'] as const;

interface Draft {
  name: string;
  phone: string;
  skills: string[];
  citySlug: string;
  localitySlug: string;
  radiusKm: number;
  wage: string;
  wageType: 'PER_DAY' | 'PER_HOUR' | 'PER_MONTH';
  languages: string[];
}

export function WorkerOnboarding({
  cities,
  categories,
  skills,
}: {
  cities: readonly SeedCity[];
  categories: Category[];
  skills: Skill[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState(categories[0]?.slug ?? '');
  const [done, setDone] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    name: '',
    phone: '',
    skills: [],
    citySlug: '',
    localitySlug: '',
    radiusKm: 15,
    wage: '',
    wageType: 'PER_DAY',
    languages: ['Hindi'],
  });

  const localities = cities.find((city) => city.slug === draft.citySlug)?.localities ?? [];
  const categorySkills = skills.filter((skill) => skill.category.slug === category);

  const canContinue = [
    draft.name.trim().length >= 2 && /^[6-9]\d{9}$/.test(draft.phone),
    draft.skills.length > 0,
    Boolean(draft.citySlug),
    Number(draft.wage) >= 50,
    // The last step only summarises what the earlier ones already validated.
    true,
  ][step];

  function patch(next: Partial<Draft>): void {
    setDraft((previous) => ({ ...previous, ...next }));
  }

  function next(): void {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    setDone(true);
    toast.success('Profile ready', {
      description: 'Auth and the profile API are not connected yet, so nothing was saved.',
    });
  }

  if (done) {
    return (
      <div className="bg-card rounded-lg border p-8 text-center">
        <PartyPopper className="text-action mx-auto size-10" aria-hidden />
        <h2 className="mt-4 text-xl font-bold">
          Your profile is ready, {draft.name.split(' ')[0]}
        </h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
          Employers hiring within {draft.radiusKm} km of your area can now find you. This build has
          no backend yet, so nothing was actually saved.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="action" onClick={() => router.push(routes.w.home)}>
            Go to your home screen
          </Button>
          <Button variant="outline" onClick={() => router.push(routes.w.jobs)}>
            See jobs near you
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </span>
          <span className="text-muted-foreground" data-numeric>
            {Math.round(((step + 1) / STEPS.length) * 100)}%
          </span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} />
      </div>

      <div className="bg-card rounded-lg border p-5 sm:p-6">
        {step === 0 ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">What is your name?</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                This is what employers see. Use the name you go by at work.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ob-name">Full name</Label>
              <Input
                id="ob-name"
                value={draft.name}
                onChange={(event) => patch({ name: event.target.value })}
                autoComplete="name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ob-phone">Mobile number</Label>
              <Input
                id="ob-phone"
                inputMode="numeric"
                maxLength={10}
                placeholder="98XXXXXXXX"
                value={draft.phone}
                onChange={(event) => patch({ phone: event.target.value.replace(/\D/g, '') })}
                autoComplete="tel-national"
              />
              <p className="text-muted-foreground text-xs">
                Employers only see this after you accept their contact request. It is never shown on
                your public profile.
              </p>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">What work can you do?</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Pick everything you are able to do. You can change this later.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => setCategory(item.slug)}
                  aria-pressed={category === item.slug}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-sm transition-colors',
                    category === item.slug
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:border-action/50',
                  )}
                >
                  {item.name}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {categorySkills.map((skill) => {
                const selected = draft.skills.includes(skill.slug);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() =>
                      patch({
                        skills: selected
                          ? draft.skills.filter((item) => item !== skill.slug)
                          : [...draft.skills, skill.slug],
                      })
                    }
                    aria-pressed={selected}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors',
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

            {draft.skills.length > 0 ? (
              <p className="text-muted-foreground text-sm" data-numeric>
                {draft.skills.length} selected
              </p>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Where do you live?</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Every job you see is measured in distance from here.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ob-city">City</Label>
              <Select
                value={draft.citySlug}
                onValueChange={(value) => patch({ citySlug: value, localitySlug: '' })}
              >
                <SelectTrigger id="ob-city" className="w-full">
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
            </div>

            {localities.length > 0 ? (
              <div className="space-y-1.5">
                <Label htmlFor="ob-locality">Your area</Label>
                <Select
                  value={draft.localitySlug}
                  onValueChange={(value) => patch({ localitySlug: value })}
                >
                  <SelectTrigger id="ob-locality" className="w-full">
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
              </div>
            ) : null}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label htmlFor="ob-radius">How far can you travel for work?</Label>
                <span className="text-sm font-medium" data-numeric>
                  {draft.radiusKm} km
                </span>
              </div>
              <Slider
                id="ob-radius"
                min={5}
                max={100}
                step={5}
                value={[draft.radiusKm]}
                onValueChange={([value]) => patch({ radiusKm: value ?? 15 })}
              />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">What do you expect to be paid?</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Employers filter by this. Being realistic gets you more calls.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ob-wage">Amount (₹)</Label>
                <Input
                  id="ob-wage"
                  inputMode="numeric"
                  placeholder="800"
                  value={draft.wage}
                  onChange={(event) => patch({ wage: event.target.value.replace(/\D/g, '') })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ob-wage-type">Per</Label>
                <Select
                  value={draft.wageType}
                  onValueChange={(value) => patch({ wageType: value as Draft['wageType'] })}
                >
                  <SelectTrigger id="ob-wage-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PER_DAY">Day</SelectItem>
                    <SelectItem value="PER_HOUR">Hour</SelectItem>
                    <SelectItem value="PER_MONTH">Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Languages you speak</Label>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {LANGUAGES.slice(0, 9).map((language) => {
                  const checked = draft.languages.includes(language);
                  return (
                    <div key={language} className="flex items-center gap-2.5">
                      <Checkbox
                        id={`ob-lang-${language}`}
                        checked={checked}
                        onCheckedChange={() =>
                          patch({
                            languages: checked
                              ? draft.languages.filter((item) => item !== language)
                              : [...draft.languages, language],
                          })
                        }
                      />
                      <Label htmlFor={`ob-lang-${language}`} className="cursor-pointer font-normal">
                        {language}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Check your details</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Confirm the email we sent you to get the verified badge and appear higher in search.
                You can change any of this later from your profile.
              </p>
            </div>

            <div className="bg-muted rounded-md p-3">
              <p className="text-sm font-medium">Summary</p>
              <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
                <li>{draft.name || 'Name not set'}</li>
                <li>
                  {draft.skills.length} skills ·{' '}
                  {draft.skills.slice(0, 3).map((slug) => (
                    <Badge key={slug} variant="secondary" className="mr-1">
                      {skills.find((skill) => skill.slug === slug)?.name}
                    </Badge>
                  ))}
                </li>
                <li data-numeric>
                  {cities.find((city) => city.slug === draft.citySlug)?.name} · up to{' '}
                  {draft.radiusKm} km
                </li>
                <li data-numeric>
                  ₹{draft.wage || '—'} {draft.wageType.replace('PER_', 'per ').toLowerCase()}
                </li>
              </ul>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => setStep(Math.max(step - 1, 0))}
          disabled={step === 0}
        >
          <ArrowLeft aria-hidden />
          Back
        </Button>

        <Button variant="action" size="lg" onClick={next} disabled={!canContinue}>
          {step === STEPS.length - 1 ? 'Finish' : 'Continue'}
          <ArrowRight aria-hidden />
        </Button>
      </div>
    </div>
  );
}
