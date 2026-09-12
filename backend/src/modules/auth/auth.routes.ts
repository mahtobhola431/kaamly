import { Router } from 'express';
import {
  availabilityCheckSchema,
  changePasswordSchema,
  completeRegistrationSchema,
  forgotPasswordSchema,
  googleCallbackSchema,
  googleStartSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@rokdajob/shared';
import { authenticate } from '@/middleware/authenticate';
import { authLimiter } from '@/middleware/rate-limit';
import { validate } from '@/middleware/validate';
import * as controller from './auth.controller';

export const authRouter = Router();

/* ------------------------------------------------------------------- public */

authRouter.post('/register', authLimiter, validate({ body: registerSchema }), controller.register);
authRouter.post('/login', authLimiter, validate({ body: loginSchema }), controller.login);

authRouter.get(
  '/availability',
  validate({ query: availabilityCheckSchema }),
  controller.checkAvailability,
);

/** Rotates the refresh family. The cookie is the credential, so no body and no auth. */
authRouter.post('/refresh', controller.refresh);
authRouter.post('/logout', controller.logout);

authRouter.post(
  '/password/forgot',
  authLimiter,
  validate({ body: forgotPasswordSchema }),
  controller.forgotPassword,
);
authRouter.post(
  '/password/reset',
  authLimiter,
  validate({ body: resetPasswordSchema }),
  controller.resetPassword,
);

authRouter.post('/email/verify', validate({ body: verifyEmailSchema }), controller.verifyEmail);

/* ------------------------------------------------------------- google oauth */

authRouter.get(
  '/google',
  authLimiter,
  validate({ query: googleStartSchema }),
  controller.googleStart,
);
authRouter.get(
  '/google/callback',
  validate({ query: googleCallbackSchema }),
  controller.googleCallback,
);

/* ---------------------------------------------------------------- signed in */

authRouter.get('/me', authenticate, controller.me);
authRouter.post('/logout-all', authenticate, controller.logoutAll);
authRouter.post(
  '/complete-registration',
  authenticate,
  validate({ body: completeRegistrationSchema }),
  controller.completeRegistration,
);
authRouter.post(
  '/password/change',
  authenticate,
  authLimiter,
  validate({ body: changePasswordSchema }),
  controller.changePassword,
);
authRouter.post('/email/resend', authenticate, authLimiter, controller.resendVerification);
