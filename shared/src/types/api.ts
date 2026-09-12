import type { ApiErrorCode } from '../enums';

/** Field-level validation problem, mirrors a flattened zod issue. */
export interface ApiFieldError {
  path: string;
  message: string;
}

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  details?: ApiFieldError[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CursorMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ApiSuccess<T, M = undefined> {
  success: true;
  data: T;
  meta?: M;
}

export interface ApiFailure {
  success: false;
  error: ApiErrorBody;
}

export type ApiResponse<T, M = undefined> = ApiSuccess<T, M> | ApiFailure;

export type Paginated<T> = ApiSuccess<T[], PaginationMeta>;

export interface ListQuery {
  page?: number;
  limit?: number;
  sort?: string;
}

/** Free-form key/value map used for notification payloads and activity metadata. */
export type JsonRecord = Record<string, string | number | boolean | null>;
