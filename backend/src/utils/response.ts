import type { Response } from 'express';
import type { PaginationMeta } from '@rokdajob/shared';

/** `{ success: true, data }` — the only success shape the API emits. */
export function ok<T>(res: Response, data: T, status = 200): Response {
  return res.status(status).json({ success: true, data });
}

export function created<T>(res: Response, data: T): Response {
  return ok(res, data, 201);
}

export function noContent(res: Response): Response {
  return res.status(204).send();
}

export function paginated<T>(
  res: Response,
  items: T[],
  { page, limit, total }: { page: number; limit: number; total: number },
): Response {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  const meta: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
  return res.status(200).json({ success: true, data: items, meta });
}

export function cursorPaginated<T>(res: Response, items: T[], nextCursor: string | null): Response {
  return res
    .status(200)
    .json({ success: true, data: items, meta: { nextCursor, hasMore: nextCursor !== null } });
}
