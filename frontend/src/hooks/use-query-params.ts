'use client';

import { useCallback, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export type QueryValue = string | number | boolean | string[] | null | undefined;

/**
 * Filters live in the URL, not in component state.
 *
 * That makes every filtered view shareable, back-button friendly and server-renderable —
 * which matters because the worker-facing pages are server components on slow phones.
 */
export function useQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const get = useCallback(
    (key: string): string | undefined => searchParams.get(key) ?? undefined,
    [searchParams],
  );

  const getAll = useCallback(
    (key: string): string[] => searchParams.getAll(key).flatMap((value) => value.split(',')),
    [searchParams],
  );

  const has = useCallback(
    (key: string, value: string): boolean => getAll(key).includes(value),
    [getAll],
  );

  /** Applies a patch of params. Any change resets pagination to page 1. */
  const setParams = useCallback(
    (patch: Record<string, QueryValue>, options?: { resetPage?: boolean }) => {
      const next = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(patch)) {
        next.delete(key);
        if (value === null || value === undefined || value === '' || value === false) continue;
        if (Array.isArray(value)) {
          if (value.length > 0) next.set(key, value.join(','));
        } else {
          next.set(key, String(value));
        }
      }

      if (options?.resetPage !== false) next.delete('page');

      const query = next.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  /** Adds or removes one value from a multi-value param. */
  const toggleParam = useCallback(
    (key: string, value: string) => {
      const current = getAll(key);
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      setParams({ [key]: next });
    },
    [getAll, setParams],
  );

  const clearAll = useCallback(
    (keep: string[] = []) => {
      const next = new URLSearchParams();
      for (const key of keep) {
        const value = searchParams.get(key);
        if (value) next.set(key, value);
      }
      const query = next.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  return { get, getAll, has, setParams, toggleParam, clearAll, isPending, searchParams };
}
