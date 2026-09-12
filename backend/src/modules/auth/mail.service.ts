import { BRAND } from '@rokdajob/shared';
import { env, isProduction } from '@/config/env';
import { logger } from '@/config/logger';

/**
 * Transactional email for the auth flows.
 *
 * There is deliberately no SMTP client wired up yet: no mail dependency is installed, and
 * guessing at a provider now would be dead code. Until one is chosen, every message is
 * written to the server log, which is enough to click through the flows in development.
 *
 * To go live, install a transport (nodemailer or an API client), implement `deliver()`
 * against the existing SMTP_* / MAIL_FROM variables, and delete this note. Production
 * boot already logs a warning while this is unimplemented.
 */
export interface MailMessage {
  to: string;
  subject: string;
  /** Plain-text body. The action link is always included verbatim so it is clickable. */
  text: string;
}

const smtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD);

function deliver(message: MailMessage): Promise<void> {
  if (isProduction && !smtpConfigured) {
    logger.error(
      { to: message.to, subject: message.subject },
      'Email not sent: no SMTP transport is implemented. See modules/auth/mail.service.ts',
    );
    return Promise.resolve();
  }

  logger.info(
    { to: message.to, subject: message.subject, body: message.text },
    'Outbound email (log transport)',
  );
  return Promise.resolve();
}

export function verificationUrl(token: string): string {
  return `${env.APP_WEB_URL}/verify-email?token=${encodeURIComponent(token)}`;
}

export function passwordResetUrl(token: string): string {
  return `${env.APP_WEB_URL}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  await deliver({
    to,
    subject: `Confirm your ${BRAND.name} email address`,
    text: `Hi ${name},\n\nConfirm your email address to finish setting up your ${BRAND.name} account:\n${verificationUrl(token)}\n\nThe link is valid for 24 hours.`,
  });
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  await deliver({
    to,
    subject: `Reset your ${BRAND.name} password`,
    text: `Hi ${name},\n\nUse this link to choose a new password:\n${passwordResetUrl(token)}\n\nThe link is valid for 1 hour. If you did not ask for this, you can ignore this email.`,
  });
}

export async function sendApprovalEmail(to: string, name: string) {
  await deliver({
    to,
    subject: `Your ${BRAND.name} contractor account is approved`,
    text: `Hi ${name},\n\nYour contractor account has been approved. You can now post jobs and contact workers.\n\n${env.APP_WEB_URL}/login`,
  });
}

export async function sendRejectionEmail(to: string, name: string, reason: string) {
  await deliver({
    to,
    subject: `About your ${BRAND.name} contractor account`,
    text: `Hi ${name},\n\nWe could not approve your contractor account.\n\nReason: ${reason}\n\nReply to ${BRAND.supportEmail} if you would like this looked at again.`,
  });
}
