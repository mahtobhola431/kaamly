import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';
import { MongoServerError } from 'mongodb';
import { Error as MongooseError } from 'mongoose';
import { ZodError } from 'zod';
import { ApiErrorCode } from '@rokdajob/shared';
import type { ApiFieldError } from '@rokdajob/shared';
import { isProduction } from '@/config/env';
import { logger } from '@/config/logger';
import { ApiError, isApiError } from '@/utils/api-error';

/** Terminal 404 for unmatched routes, so the client always gets the standard envelope. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(
    new ApiError(404, ApiErrorCode.NOT_FOUND, `Route ${req.method} ${req.originalUrl} not found`),
  );
};

function zodToFieldErrors(error: ZodError): ApiFieldError[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

/** `E11000 duplicate key error ... index: job_1_worker_1` -> the offending index name. */
function duplicateKeyToApiError(error: MongoServerError): ApiError {
  const keys = Object.keys((error.keyPattern as Record<string, unknown>) ?? {});

  if (keys.includes('job') && keys.includes('worker')) {
    return new ApiError(
      409,
      ApiErrorCode.DUPLICATE_APPLICATION,
      'You have already applied to this job',
    );
  }
  if (keys.includes('job') && keys.includes('author') && keys.includes('subject')) {
    return new ApiError(409, ApiErrorCode.ALREADY_REVIEWED, 'You have already reviewed this job');
  }

  const field = keys[0] ?? 'value';
  const label = field === 'phone' ? 'phone number' : field === 'email' ? 'email address' : field;
  return new ApiError(409, ApiErrorCode.CONFLICT, `That ${label} is already registered`);
}

function normalize(error: unknown): ApiError {
  if (isApiError(error)) return error;

  if (error instanceof ZodError) {
    return ApiError.validation(zodToFieldErrors(error));
  }

  if (error instanceof MongooseError.ValidationError) {
    const details: ApiFieldError[] = Object.values(error.errors).map((issue) => ({
      path: issue.path,
      message: issue.message,
    }));
    return ApiError.validation(details);
  }

  if (error instanceof MongooseError.CastError) {
    return new ApiError(400, ApiErrorCode.VALIDATION_ERROR, `Invalid value for ${error.path}`);
  }

  if (error instanceof MongoServerError && error.code === 11000) {
    return duplicateKeyToApiError(error);
  }

  if (error instanceof Error && error.name === 'TokenExpiredError') {
    return ApiError.tokenExpired();
  }
  if (error instanceof Error && error.name === 'JsonWebTokenError') {
    return ApiError.unauthenticated('Invalid session token');
  }

  if (
    error instanceof Error &&
    'type' in error &&
    (error as { type?: string }).type === 'entity.too.large'
  ) {
    return new ApiError(413, ApiErrorCode.PAYLOAD_TOO_LARGE, 'Request body is too large');
  }

  return ApiError.internal();
}

/**
 * Centralised error handler. Operational errors are logged at warn, unexpected ones at
 * error with the stack. Stacks are never returned to the client in production.
 */
export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const apiError = normalize(error);
  const context = {
    method: req.method,
    url: req.originalUrl,
    status: apiError.statusCode,
    code: apiError.code,
    userId: req.auth?.userId,
  };

  if (apiError.statusCode >= 500) {
    logger.error({ ...context, err: error }, apiError.message);
  } else {
    logger.warn(context, apiError.message);
  }

  res.status(apiError.statusCode).json({
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details ? { details: apiError.details } : {}),
      ...(isProduction || apiError.statusCode < 500
        ? {}
        : { stack: error instanceof Error ? error.stack : undefined }),
    },
  });
};
