'use client';

import type { Category, SeedCity } from '@rokdajob/shared';
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

const SHIFT_OPTIONS = [
  { value: 'DAY', label: 'Day shift' },
  { value: 'NIGHT', label: 'Night shift' },
  { value: 'ROTATIONAL', label: 'Rotational' },
  { value: 'FLEXIBLE', label: 'Flexible' },
];

const URGENCY_OPTIONS = [
  { value: 'IMMEDIATE', label: 'Start immediately' },
  { value: 'URGENT', label: 'Urgent' },
];

const PERK_OPTIONS = [
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'food', label: 'Food provided' },
  { value: 'transport', label: 'Transport' },
];

const EXPERIENCE_OPTIONS = [
  { value: '0', label: 'No experience needed' },
  { value: '2', label: 'Up to 2 years' },
  { value: '5', label: 'Up to 5 years' },
];

export function JobFilters({
  cities,
  categories,
}: {
  cities: readonly SeedCity[];
  categories: Category[];
}) {
  const { get, setParams, searchParams } = useQueryParams();

  const city = get('city') ?? '';
  const category = get('category') ?? '';
  const radius = Number(get('radius') ?? 15);
  const minSalary = Number(get('minSalary') ?? 0);

  const activeCount = ['category', 'shift', 'urgency', 'perk', 'maxExperience', 'minSalary'].filter(
    (key) => searchParams.has(key),
  ).length;

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
                <Label htmlFor="job-radius" className="text-sm font-normal">
                  Within
                </Label>
                <span className="text-sm font-medium" data-numeric>
                  {radius} km
                </span>
              </div>
              <Slider
                id="job-radius"
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

      <FilterSection title="Work category">
        <Select value={category} onValueChange={(value) => setParams({ category: value })}>
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

      <FilterSection title="Minimum pay">
        <div className="mb-2 flex items-center justify-between">
          <Label htmlFor="minSalary" className="text-sm font-normal">
            At least
          </Label>
          <span className="text-sm font-medium" data-numeric>
            {minSalary > 0 ? `₹${minSalary}/day` : 'Any'}
          </span>
        </div>
        <Slider
          id="minSalary"
          min={0}
          max={2000}
          step={100}
          value={[minSalary]}
          onValueChange={([value]) => setParams({ minSalary: value || null })}
        />
      </FilterSection>

      <FilterSection title="Shift">
        <CheckboxFilter param="shift" options={SHIFT_OPTIONS} />
      </FilterSection>

      <FilterSection title="Urgency">
        <CheckboxFilter param="urgency" options={URGENCY_OPTIONS} />
      </FilterSection>

      <FilterSection title="Experience required">
        <RadioFilter param="maxExperience" options={EXPERIENCE_OPTIONS} allLabel="Any" />
      </FilterSection>

      <FilterSection title="What is provided">
        <CheckboxFilter param="perk" options={PERK_OPTIONS} />
      </FilterSection>
    </FilterShell>
  );
}
