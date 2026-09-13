import { z } from 'zod';
import {
  emailSchema,
  nameSchema,
  objectIdSchema,
  passwordSchema,
  phoneSchema,
  usernameSchema,
} from './common';

/**
 * Registration asks one question that shapes everything after it: are you here to work
 * ("employee" -> WORKER) or to hire ("contractor" -> EMPLOYER)?
 *
 * Workers are usable immediately. Contractors are created at ApprovalStatus.PENDING and
 * cannot post jobs or reach workers until an admin approves them (docs/02-API.md `/admin`).
 * ADMIN is deliberately absent: admins are seeded, never self-registered.
 */
export const registrableRoleSchema = z.enum(['WORKER', 'EMPLOYER'], {
  errorMap: () => ({ message: 'Choose whether you are joining as an employee or a contractor' }),
});
export type RegistrableRole = z.infer<typeof registrableRoleSchema>;

const registerBase = z.object({
  name: nameSchema,
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  /** Optional at signup; workers add it during profile onboarding. */
  phone: phoneSchema.optional(),
});

export const registerSchema = z
  .discriminatedUnion('role', [
    registerBase.extend({ role: z.literal('WORKER') }),
    registerBase.extend({
      role: z.literal('EMPLOYER'),
      companyName: z.string().trim().min(2, 'Company name is too short').max(120),
    }),
  ])
  .describe('Register as an employee (WORKER) or a contractor (EMPLOYER)');
export type RegisterInput = z.infer<typeof registerSchema>;

/** Login accepts either the email address or the username in one field. */
export const loginSchema = z
  .object({
    identifier: z.string().trim().min(3, 'Enter your email address or username'),
    password: z.string().min(1, 'Enter your password'),
  })
  .describe('Password login using either an email address or a username');
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Google sign-in finishes at the callback, where the user may still have to pick a role.
 * `state` carries the CSRF nonce minted at `/auth/google`.
 */
export const googleCallbackSchema = z.object({
  code: z.string().min(10, 'Missing Google authorization code'),
  state: z.string().min(10, 'Missing OAuth state'),
});
export type GoogleCallbackInput = z.infer<typeof googleCallbackSchema>;

export const googleStartSchema = z.object({
  /** Pre-selects the role so a first-time Google user lands fully registered. */
  role: registrableRoleSchema.optional(),
  /**
   * Where to land after the callback, so a sign-in that interrupted something returns to
   * it. Constrained to a path on our own site: the callback resolves this against the web
   * app's origin, and an absolute or protocol-relative value would turn our OAuth
   * endpoint into an open redirect for anyone who can hand a user a link.
   */
  redirect: z
    .string()
    .trim()
    .max(300)
    .refine(
      (value) => value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\'),
      'Redirect must be a path on this site',
    )
    .optional(),
});
export type GoogleStartInput = z.infer<typeof googleStartSchema>;

/** Finishes a Google signup that arrived without a role. */
export const completeRegistrationSchema = z
  .object({
    role: registrableRoleSchema,
    username: usernameSchema.optional(),
    companyName: z.string().trim().min(2).max(120).optional(),
  })
  .refine((value) => value.role !== 'EMPLOYER' || Boolean(value.companyName), {
    message: 'Company name is required for contractors',
    path: ['companyName'],
  });
export type CompleteRegistrationInput = z.infer<typeof completeRegistrationSchema>;

export const availabilityCheckSchema = z
  .object({
    username: usernameSchema.optional(),
    email: emailSchema.optional(),
  })
  .refine((value) => Boolean(value.username) || Boolean(value.email), {
    message: 'Provide a username or an email address to check',
  });
export type AvailabilityCheckInput = z.infer<typeof availabilityCheckSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10, 'This reset link is not valid'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: passwordSchema,
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: 'The new password must be different from the current one',
    path: ['newPassword'],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(10, 'This verification link is not valid'),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

/* --------------------------------------------------------------- admin review */

export const approvalQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
  q: z.string().trim().max(120).optional(),
});
export type ApprovalQueryInput = z.infer<typeof approvalQuerySchema>;

export const approveUserSchema = z.object({
  note: z.string().trim().max(500).optional(),
});
export type ApproveUserInput = z.infer<typeof approveUserSchema>;

/** A rejection must say why — the reason is shown to the contractor on their next login. */
export const rejectUserSchema = z.object({
  reason: z.string().trim().min(5, 'Give a reason the contractor can act on').max(500),
});
export type RejectUserInput = z.infer<typeof rejectUserSchema>;

export const userIdParamSchema = z.object({ id: objectIdSchema });
export type UserIdParam = z.infer<typeof userIdParamSchema>;
