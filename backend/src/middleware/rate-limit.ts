import rateLimit, { type Options } from 'express-rate-limit';
import { ApiErrorCode } from '@rokdajob/shared';
import { env, isTest } from '@/config/env';

const shared: Partial<Options> = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Tests would otherwise trip limits while exercising flows repeatedly.
  skip: () => isTest,
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json({
      success: false,
      error: {
        code: ApiErrorCode.RATE_LIMITED,
        message: 'Too many requests. Please slow down and try again shortly.',
      },
    });
  },
};

/** Baseline limit applied to the whole API surface. */
export const globalLimiter = rateLimit({
  ...shared,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
});

/** Credential endpoints: brute-force resistance matters more than convenience. */
export const authLimiter = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: 20,
});

/** OTP costs money to send, so it is limited per phone number as well as per IP. */
export const otpLimiter = rateLimit({
  ...shared,
  windowMs: 10 * 60 * 1000,
  limit: 5,
  keyGenerator: (req) => {
    const phone = (req.body as { phone?: string } | undefined)?.phone;
    return phone ? `otp:${phone}` : `otp-ip:${req.ip}`;
  },
});

/** Geo search is the most expensive read path in the product. */
export const searchLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 1000,
  limit: 60,
});

/** Revealing a worker phone number is audited and tightly limited (docs/06-RISKS.md R10). */
export const contactLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 60 * 1000,
  limit: 30,
});

/**
 * Applying and messaging.
 *
 * Generous enough that a worker going through a page of results and applying to every
 * job that fits never notices it, tight enough that a script cannot spray a thousand
 * applications across the board.
 */
export const applyLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 60 * 1000,
  limit: 60,
});

export const messageLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 1000,
  limit: 30,
});

export const uploadLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 60 * 1000,
  limit: 40,
});
