import { ApiErrorCode } from '../enums';
import type { ApiErrorBody, ApiFieldError, PaginationMeta } from '../types/api';

/**
 * Framework-agnostic client for the rokdajob API.
 *
 * Each app creates one instance with its own base URL (see `frontend/src/lib/api/client.ts`),
 * so the request/response contract lives in exactly one place while environment
 * configuration stays inside the app that owns it.
 */

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details: ApiFieldError[];

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = body.code;
    this.details = body.details ?? [];
  }

  /** True when the user can fix this by editing the form. */
  get isValidation(): boolean {
    return this.code === ApiErrorCode.VALIDATION_ERROR;
  }

  get isAuth(): boolean {
    return this.code === ApiErrorCode.UNAUTHENTICATED || this.code === ApiErrorCode.TOKEN_EXPIRED;
  }

  /** Field errors keyed by path, ready to feed into react-hook-form's `setError`. */
  fieldErrors(): Record<string, string> {
    return Object.fromEntries(this.details.map((detail) => [detail.path, detail.message]));
  }
}

export type QueryValue = string | number | boolean | undefined | null | string[];

export interface RequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Appended as a query string; empty and nullish values are dropped. */
  query?: Record<string, QueryValue>;
  /** Bearer token. On the server the caller reads it from cookies and passes it in. */
  token?: string;
  /** Next.js fetch cache options, ignored by other runtimes. */
  next?: { revalidate?: number | false; tags?: string[] };
}

export interface ApiResult<T, M = undefined> {
  data: T;
  meta: M;
}

export interface ApiClientOptions {
  /** Base URL including the version prefix, e.g. `http://localhost:5000/api/v1`. */
  baseUrl: string;
  /** Supplies the access token when the caller does not pass one explicitly. */
  getToken?: () => string | undefined | Promise<string | undefined>;
  /** Called once for every 401/expired response, so an app can trigger a refresh. */
  onUnauthenticated?: (error: ApiClientError) => void;
}

function buildQuery(query: RequestOptions['query']): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export interface ApiClient {
  request<T, M = undefined>(path: string, options?: RequestOptions): Promise<ApiResult<T, M>>;
  /** Returns just `data`, for the common case. */
  get<T>(path: string, options?: RequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  del<T>(path: string, options?: RequestOptions): Promise<T>;
  /** Paginated list endpoints: unwraps `data` and `meta` together. */
  list<T>(path: string, options?: RequestOptions): Promise<{ items: T[]; meta: PaginationMeta }>;
}

export function createApiClient({
  baseUrl,
  getToken,
  onUnauthenticated,
}: ApiClientOptions): ApiClient {
  const root = baseUrl.replace(/\/$/, '');

  async function request<T, M = undefined>(
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiResult<T, M>> {
    const { method = 'GET', body, query, token, headers, next, ...rest } = options;
    const bearer = token ?? (await getToken?.());
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    const url = `${root}${path.startsWith('/') ? path : `/${path}`}${buildQuery(query)}`;

    let response: Response;
    try {
      response = await fetch(url, {
        ...rest,
        method,
        // The refresh token travels as an httpOnly cookie.
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          ...(isFormData || body === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
          ...headers,
        },
        ...(body !== undefined
          ? { body: isFormData ? (body as FormData) : JSON.stringify(body) }
          : {}),
        ...(next ? ({ next } as RequestInit) : {}),
      });
    } catch {
      // Network failure, DNS, or the API being down. Never leak the raw cause to the UI.
      throw new ApiClientError(0, {
        code: ApiErrorCode.INTERNAL,
        message: 'Could not reach the server. Check your connection and try again.',
      });
    }

    if (response.status === 204) {
      return { data: undefined as T, meta: undefined as M };
    }

    const payload = (await response.json().catch(() => null)) as
      { success: true; data: T; meta?: M } | { success: false; error: ApiErrorBody } | null;

    if (!payload) {
      throw new ApiClientError(response.status, {
        code: ApiErrorCode.INTERNAL,
        message: 'The server returned an unreadable response.',
      });
    }

    if (!response.ok || payload.success === false) {
      const body =
        payload.success === false
          ? payload.error
          : { code: ApiErrorCode.INTERNAL, message: 'Request failed' };
      const error = new ApiClientError(response.status, body);
      if (error.isAuth) onUnauthenticated?.(error);
      throw error;
    }

    return { data: payload.data, meta: payload.meta as M };
  }

  // Generic method implementations do not inherit contextual parameter types from a
  // generic interface signature, so each one is annotated explicitly.
  const client: ApiClient = {
    request,
    async get<T>(path: string, options?: RequestOptions): Promise<T> {
      return (await request<T>(path, { ...options, method: 'GET' })).data;
    },
    async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
      return (await request<T>(path, { ...options, method: 'POST', body })).data;
    },
    async patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
      return (await request<T>(path, { ...options, method: 'PATCH', body })).data;
    },
    async del<T>(path: string, options?: RequestOptions): Promise<T> {
      return (await request<T>(path, { ...options, method: 'DELETE' })).data;
    },
    async list<T>(
      path: string,
      options?: RequestOptions,
    ): Promise<{ items: T[]; meta: PaginationMeta }> {
      const { data, meta } = await request<T[], PaginationMeta>(path, options);
      return { items: data, meta };
    },
  };

  return client;
}
