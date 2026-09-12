import { parseArgs } from 'node:util';
import { AdminLevel, ApprovalStatus, AuthProvider, UserRole } from '@rokdajob/shared';
import { logger } from '@/config/logger';
import { connectDatabase, disconnectDatabase } from '@/database/connection';
import { User, hashPassword } from '@/modules/auth/user.model';

/**
 * Creates (or re-points) the admin account used to approve contractors.
 *
 * Admins never register through the public API — there is no code path that grants
 * UserRole.ADMIN over HTTP — so the first one has to be made here.
 *
 *   npm run seed:admin -w @rokdajob/backend -- \
 *     --email you@example.com --username you --name "Your Name" --password 'secret123'
 *
 * Re-running with the same email resets that admin's password rather than failing, which
 * is also how you recover a locked-out admin.
 */
async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      email: { type: 'string' },
      username: { type: 'string' },
      name: { type: 'string' },
      password: { type: 'string' },
      level: { type: 'string', default: AdminLevel.SUPER },
    },
  });

  const email = values.email?.trim().toLowerCase();
  const username = values.username?.trim().toLowerCase();
  const name = values.name?.trim();
  const password = values.password;
  const level = values.level as AdminLevel;

  if (!email || !username || !name || !password) {
    throw new Error(
      'Usage: --email <email> --username <username> --name <name> --password <password> [--level SUPPORT|MODERATOR|SUPER]',
    );
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  if (!Object.values(AdminLevel).includes(level)) {
    throw new Error(`--level must be one of ${Object.values(AdminLevel).join(', ')}`);
  }

  await connectDatabase();

  const passwordHash = await hashPassword(password);
  const existing = await User.findOne({ email });

  if (existing) {
    existing.name = name;
    existing.role = UserRole.ADMIN;
    existing.adminLevel = level;
    existing.passwordHash = passwordHash;
    existing.passwordChangedAt = new Date();
    existing.approval = { status: ApprovalStatus.AUTO_APPROVED };
    existing.registrationComplete = true;
    existing.emailVerifiedAt ??= new Date();
    existing.failedLoginAttempts = 0;
    existing.lockedUntil = undefined;
    await existing.save();

    logger.info({ email, level }, 'Existing account promoted to admin and password reset');
    return;
  }

  await User.create({
    name,
    username,
    email,
    passwordHash,
    providers: [AuthProvider.LOCAL],
    role: UserRole.ADMIN,
    adminLevel: level,
    approval: { status: ApprovalStatus.AUTO_APPROVED },
    registrationComplete: true,
    emailVerifiedAt: new Date(),
  });

  logger.info({ email, username, level }, 'Admin created');
}

main()
  .catch((error: unknown) => {
    logger.error({ err: error }, 'Admin seed failed');
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
