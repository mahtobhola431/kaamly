'use client';

import { LANGUAGES } from '@rokdajob/shared';
import type { Category, SeedCity, Skill } from '@rokdajob/shared';
import {
  CheckboxFilter,
  FilterSection,
  FilterShell,
  RadioFilter,
} from '@/components/domain/filter-shell';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useQueryParams } from '@/hooks/use-query-params';

const AVAILABILITY_OPTIONS = [
  { value: 'AVAILABLE_NOW', label: 'Available now' },
  { value: 'AVAILABLE_FROM', label: 'Available from a date' },
  { value: 'BUSY', label: 'Currently working' },
];

const EXPERIENCE_OPTIONS = [
  { value: '1', label: '1+ years' },
  { value: '3', label: '3+ years' },
  { value: '5', label: '5+ years' },
  { value: '8', label: '8+ years' },
];

const RATING_OPTIONS = [
  { value: '4.5', label: '4.5 and above' },
  { value: '4', label: '4.0 and above' },
  { value: '3.5', label: '3.5 and above' },
];

export function WorkerFilters({
  cities,
  categories,
  skills,
}: {
  cities: readonly SeedCity[];
  categories: Category[];
  skills: Skill[];
}) {
  const { get, setParams, searchParams } = useQueryParams();

  const city = get('city') ?? '';
  const category = get('category') ?? '';
  const radius = Number(get('radius') ?? 15);
  const maxWage = Number(get('maxWage') ?? 0);

  // Only offer skills from the selected category, otherwise the list is unusable.
  const skillOptions = (category ? skills.filter((s) => s.category.slug === category) : skills)
    .slice(0, 14)
    .map((skill) => ({ value: skill.slug, label: skill.name }));

  const activeCount = [
    'category',
    'skill',
    'availability',
    'minExperience',
    'minRating',
    'verified',
    'language',
    'maxWage',
  ].filter((key) => searchParams.has(key)).length;

  return (
    <FilterShell activeCount={activeCount} keepOnClear={['city', 'q']}>
      <FilterSection title="Location">
        <div className="space-y-3">
          <Select value={city} onValueChange={(value) => setParams({ city: value })}>
            <SelectTrigger className="w-full" aria-label="City">
              <SelectValue placeholder="Any city" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((option) => (
                <SelectItem key={option.slug} value={option.slug}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {city ? (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label htmlFor="radius" className="text-sm font-normal">
                  Within
                </Label>
                <span className="text-sm font-medium" data-numeric>
                  {radius} km
                </span>
              </div>
              <Slider
                id="radius"
                min={5}
                max={100}
                step={5}
                value={[radius]}
                onValueChange={([value]) => setParams({ radius: value ?? 15 })}
              />
            </div>
          ) : null}
        </div>
      </FilterSection>

      <FilterSection title="Category">
        <Select
          value={category}
          onValueChange={(value) => setParams({ category: value, skill: null })}
        >
          <SelectTrigger className="w-full" aria-label="Work category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((option) => (
              <SelectItem key={option.slug} value={option.slug}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      <FilterSection title="Skill">
        <CheckboxFilter param="skill" options={skillOptions} />
      </FilterSection>

      <FilterSection title="Availability">
        <CheckboxFilter param="availability" options={AVAILABILITY_OPTIONS} />
      </FilterSection>

      <FilterSection title="Experience">
        <RadioFilter param="minExperience" options={EXPERIENCE_OPTIONS} allLabel="Any experience" />
      </FilterSection>

      <FilterSection title="Expected wage">
        <div className="mb-2 flex items-center justify-between">
          <Label htmlFor="maxWage" className="text-sm font-normal">
            Up to
          </Label>
          <span className="text-sm font-medium" data-numeric>
            {maxWage > 0 ? `₹${maxWage}/day` : 'Any'}
          </span>
        </div>
        <Slider
          id="maxWage"
          min={0}
          max={2000}
          step={100}
          value={[maxWage]}
          onValueChange={([value]) => setParams({ maxWage: value || null })}
        />
      </FilterSection>

      <FilterSection title="Rating">
        <RadioFilter param="minRating" options={RATING_OPTIONS} allLabel="Any rating" />
      </FilterSection>

      <FilterSection title="Verification">
        <CheckboxFilter
          param="verified"
          options={[{ value: 'profile', label: 'Profile verified only' }]}
        />
      </FilterSection>

      <FilterSection title="Language">
        <CheckboxFilter
          param="language"
          options={LANGUAGES.slice(0, 8).map((language) => ({
            value: language,
            label: language,
          }))}
          columns={2}
        />
      </FilterSection>
    </FilterShell>
  );
}
