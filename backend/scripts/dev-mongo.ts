/**
 * Disposable MongoDB for local development.
 *
 * Starts an in-memory single-node **replica set** (so `withTransaction()` takes the real
 * transactional path, matching Atlas) and keeps running until you press Ctrl+C.
 *
 *   npm run dev:db -w @rokdajob/backend
 *
 * Paste the printed URI into backend/.env as MONGODB_URI. Data lives in memory only and
 * is gone when the process stops — run `npm run seed` after starting it.
 */
import { MongoMemoryReplSet } from 'mongodb-memory-server';

async function main(): Promise<void> {
  process.stdout.write('Starting in-memory MongoDB replica set...\n');

  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
    instanceOpts: [{ port: 27017 }],
  });

  // getUri() places the database name before the query string, so the replicaSet
  // parameter survives.
  const uri = replSet.getUri('rokdajob');

  process.stdout.write(
    [
      '',
      '  MongoDB is running (in-memory, replica set, transactions enabled)',
      '',
      `  MONGODB_URI=${uri}`,
      '',
      '  Copy that line into backend/.env, then in another terminal:',
      '    npm run seed',
      '    npm run dev',
      '',
      '  Data is not persisted. Press Ctrl+C to stop.',
      '',
    ].join('\n'),
  );

  const stop = async (): Promise<void> => {
    process.stdout.write('\nStopping in-memory MongoDB...\n');
    await replSet.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => void stop());
  process.on('SIGTERM', () => void stop());
}

main().catch((error: unknown) => {
  process.stderr.write(`Failed to start in-memory MongoDB: ${String(error)}\n`);
  process.exit(1);
});
