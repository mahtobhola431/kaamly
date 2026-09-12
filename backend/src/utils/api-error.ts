import { ApiErrorCode } from '@rokdajob/shared';
import type { ApiFieldError } from '@rokdajob/shared';

/**
 * The only error type controllers and services are expected to throw.
 * Anything else reaching the error handler is treated as an unexpected 500.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: ApiErrorCode;
  readonly details?: ApiFieldError[];
  /** `true` for errors that are part of normal operation and should not page anyone. */
  readonly isOperational = true;

  constructor(statusCode: number, code: ApiErrorCode, message: string, details?: ApiFieldError[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    if (details) this.details = details;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message = 'Invalid request', details?: ApiFieldError[]): ApiError {
    return new ApiError(400, ApiErrorCode.VALIDATION_ERROR, message, details);
  }

  static validation(details: ApiFieldError[], message = 'Please check the highlighted fields') {
    return new ApiError(400, ApiErrorCode.VALIDATION_ERROR, message, details);
  }

  static unauthenticated(message = 'You need to sign in to continue'): ApiError {
    return new ApiError(401, ApiErrorCode.UNAUTHENTICATED, message);
  }

  static tokenExpired(message = 'Your session has expired'): ApiError {
    return new ApiError(401, ApiErrorCode.TOKEN_EXPIRED, message);
  }

  static forbidden(message = 'You do not have access to this'): ApiError {
    return new ApiError(403, ApiErrorCode.FORBIDDEN, message);
  }

  static notFound(what = 'Resource'): ApiError {
    return new ApiError(404, ApiErrorCode.NOT_FOUND, `${what} not found`);
  }

  static conflict(message: string, code: ApiErrorCode = ApiErrorCode.CONFLICT): ApiError {
    return new ApiError(409, code, message);
  }

  static unprocessable(code: ApiErrorCode, message: string): ApiError {
    return new ApiError(422, code, message);
  }

  static rateLimited(message = 'Too many requests. Please try again shortly.'): ApiError {
    return new ApiError(429, ApiErrorCode.RATE_LIMITED, message);
  }

  static internal(message = 'Something went wrong on our side'): ApiError {
    return new ApiError(500, ApiErrorCode.INTERNAL, message);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
