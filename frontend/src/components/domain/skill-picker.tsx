'use client';

import { useMemo, useState } from 'react';
import { LIMITS } from '@rokdajob/shared';
import type { Category, Skill, SkillLevel } from '@rokdajob/shared';
import { Check, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface PickedSkill {
  slug: string;
  years: number;
  level: SkillLevel;
}

const LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'BEGINNER', label: 'Learning' },
  { value: 'SKILLED', label: 'Skilled' },
  { value: 'EXPERT', label: 'Expert' },
];

/**
 * Skill selection with alias-aware search, so a worker who types "mistri" or "bijli"
 * finds Mason and Electrician. The alias list comes from the catalog, not hardcoded here.
 */
export function SkillPicker({
  categories,
  skills,
  initial,
}: {
  categories: Category[];
  skills: Skill[];
  initial: PickedSkill[];
}) {
  const [picked, setPicked] = useState<PickedSkill[]>(initial);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');

  const bySlug = useMemo(
    () => Object.fromEntries(skills.map((skill) => [skill.slug, skill])),
    [skills],
  );

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return skills.filter((skill) => {
      if (category !== 'all' && skill.category.slug !== category) return false;
      if (!needle) return true;
      return (
        skill.name.toLowerCase().includes(needle) ||
        skill.aliases.some((alias) => alias.includes(needle))
      );
    });
  }, [skills, query, category]);

  function toggle(slug: string): void {
    setPicked((previous) => {
      if (previous.some((item) => item.slug === slug)) {
        return previous.filter((item) => item.slug !== slug);
      }
      if (previous.length >= LIMITS.maxSkillsPerWorker) {
        toast.error(`You can select up to ${LIMITS.maxSkillsPerWorker} skills`);
        return previous;
      }
      return [...previous, { slug, years: 1, level: 'SKILLED' }];
    });
  }

  function update(slug: string, patch: Partial<PickedSkill>): void {
    setPicked((previous) =>
      previous.map((item) => (item.slug === slug ? { ...item, ...patch } : item)),
    );
  }

  return (
    <div className="space-y-6">
      <section className="bg-card rounded-lg border p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Your skills</h2>
          <span className="text-muted-foreground text-sm" data-numeric>
            {picked.length} of {LIMITS.maxSkillsPerWorker}
          </span>
        </div>

        {picked.length === 0 ? (
          <p className="text-muted-foreground mt-3 text-sm">
            Nothing selected yet. Search below and tap a trade to add it.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {picked.map((item) => {
              const skill = bySlug[item.slug];
              if (!skill) return null;

              return (
                <li
                  key={item.slug}
                  className="flex flex-wrap items-center gap-3 rounded-md border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{skill.name}</p>
                    <p className="text-muted-foreground text-xs">{skill.category.name}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor={`years-${item.slug}`} className="sr-only">
                      Years of experience in {skill.name}
                    </Label>
                    <Input
                      id={`years-${item.slug}`}
                      inputMode="numeric"
                      value={item.years}
                      onChange={(event) =>
                        update(item.slug, { years: Number(event.target.value) || 0 })
                      }
                      className="w-16"
                      aria-label={`Years in ${skill.name}`}
                    />
                    <span className="text-muted-foreground text-sm">yrs</span>
                  </div>

                  <Select
                    value={item.level}
                    onValueChange={(value) => update(item.slug, { level: value as SkillLevel })}
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-32"
                      aria-label={`Level for ${skill.name}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => toggle(item.slug)}
                    aria-label={`Remove ${skill.name}`}
                  >
                    <X aria-hidden />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="bg-card rounded-lg border p-5">
        <h2 className="font-semibold">Add a skill</h2>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search — try mistri, bijli, godown…"
              className="pl-9"
              aria-label="Search skills"
            />
          </div>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-52" aria-label="Filter by category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((item) => (
                <SelectItem key={item.slug} value={item.slug}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {matches.length === 0 ? (
          <p className="text-muted-foreground mt-4 text-sm">
            Nothing matches &ldquo;{query}&rdquo;. Try the trade name in Hindi or English.
          </p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {matches.map((skill) => {
              const selected = picked.some((item) => item.slug === skill.slug);
              return (
                <li key={skill.id}>
                  <button
                    type="button"
                    onClick={() => toggle(skill.slug)}
                    aria-pressed={selected}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors',
                      selected
                        ? 'border-success/40 bg-success-subtle text-success'
                        : 'hover:border-action/50 hover:text-action-hover',
                    )}
                  >
                    {selected ? (
                      <Check className="size-3.5" aria-hidden />
                    ) : (
                      <Plus className="size-3.5" aria-hidden />
                    )}
                    {skill.name}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="flex items-center gap-3">
        <Button
          variant="action"
          onClick={() =>
            toast.success('Skills saved locally', {
              description: 'The profile API is not connected yet, so this is not persisted.',
            })
          }
        >
          Save skills
        </Button>
        <Badge variant="muted">{picked.length} selected</Badge>
      </div>
    </div>
  );
}
