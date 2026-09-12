/**
 * Deletes every non-admin user and their sessions.
 *
 * Admins are identified by `role: 'ADMIN'` rather than by a hardcoded email list, so a
 * renamed admin account is never caught by the sweep. Pass --apply to actually delete;
 * without it this only reports what would go.
 */
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '@/database/connection';

const apply = process.argv.includes('--apply');

async function main() {
  await connectDatabase();
  const db = mongoose.connection.db!;

  const admins = await db.collection('users').find({ role: 'ADMIN' }).toArray();
  const doomed = await db
    .collection('users')
    .find({ role: { $ne: 'ADMIN' } }, { projection: { email: 1, role: 1 } })
    .toArray();

  const lines = [
    '',
    `KEEP (${admins.length} admin${admins.length === 1 ? '' : 's'}):`,
    ...admins.map((a) => `  ${String(a.email)}  ${String(a.adminLevel)}`),
    '',
    `DELETE (${doomed.length}):`,
    ...doomed.map((u) => `  ${String(u.email)}  ${String(u.role)}`),
  ];

  if (!apply) {
    lines.push('', 'Dry run — nothing deleted. Re-run with --apply.');
    process.stdout.write(`${lines.join('\n')}\n`);
    return;
  }

  if (admins.length === 0) {
    lines.push('', 'ABORTED: no admin account found, refusing to empty the collection.');
    process.stdout.write(`${lines.join('\n')}\n`);
    process.exitCode = 1;
    return;
  }

  const ids = doomed.map((u) => u._id);
  const users = await db.collection('users').deleteMany({ _id: { $in: ids } });
  const tokens = await db.collection('refreshtokens').deleteMany({ user: { $in: ids } });

  lines.push('', `Deleted ${users.deletedCount} users and ${tokens.deletedCount} refresh tokens.`);
  process.stdout.write(`${lines.join('\n')}\n`);
}

main()
  .catch((error: unknown) => {
    process.stdout.write(`\nFailed: ${String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
