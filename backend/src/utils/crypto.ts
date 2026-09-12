import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

/**
 * Opaque, single-use secrets: refresh tokens, password-reset links, email verification.
 *
 * The plaintext is handed to the user exactly once and only its SHA-256 digest is stored,
 * so a database leak cannot be replayed. These are long random values rather than JWTs
 * precisely so they can be revoked by deleting a row.
 */
export function generateToken(bytes = 48): string {
  return randomBytes(bytes).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** New session family id, minted on login and carried through every rotation. */
export function generateFamilyId(): string {
  return randomUUID();
}

/** Constant-time comparison for two hex digests of the same length. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Turns an email local part or display name into a candidate username, then makes it
 * unique by suffixing digits. Used when Google gives us a user with no handle of their own.
 */
export function slugifyUsername(source: string): string {
  const base = source
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9._]/g, '')
    .replace(/[._]{2,}/g, '.')
    .replace(/^[^a-z]+/, '')
    .replace(/[._]+$/, '')
    .slice(0, 24);

  return base.length >= 3 ? base : `user${randomBytes(3).toString('hex')}`;
}
