import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { ApiError } from '@/utils/api-error';

export interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Parses request parts with zod and stores the *parsed* values on `req.validated`.
 *
 * The parsed output is deliberately not written back over `req.query`, because Express 5
 * exposes `query` as a getter. Controllers read `readValidated(req)` instead.
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const validated: NonNullable<Request['validated']> = {};

    for (const part of ['body', 'query', 'params'] as const) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part]);
      if (!result.success) {
        next(
          ApiError.validation(
            result.error.issues.map((issue) => ({
              path: [part, ...issue.path].join('.').replace(/^body\./, ''),
              message: issue.message,
            })),
          ),
        );
        return;
      }
      validated[part] = result.data;
    }

    req.validated = validated;
    next();
  };
}

/**
 * Typed accessors for the output of `validate()`.
 *
 * Callers name the schema's inferred type, which keeps the cast in one place instead of
 * spreading `as` through every controller:
 *
 *   const input = validatedBody<RegisterInput>(req);
 */
export function validatedBody<T>(req: Request): T {
  return req.validated?.body as T;
}

export function validatedQuery<T>(req: Request): T {
  return req.validated?.query as T;
}

export function validatedParams<T>(req: Request): T {
  return req.validated?.params as T;
}
