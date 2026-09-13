import { logger } from '@/config/logger';
import { connectDatabase, disconnectDatabase } from '@/database/connection';
import { seedCatalog } from './catalog.seed';

/**
 * Loads reference data into MongoDB.
 *
 *   npm run seed -w @rokdajob/backend
 *
 * Safe to run repeatedly: every write is an upsert keyed on a slug, so this refreshes the
 * taxonomy and geography without duplicating anything or touching user data.
 */
async function main(): Promise<void> {
  await connectDatabase();
  const counts = await seedCatalog();

  process.stdout.write(
    `\nSeeded:\n` +
      `  ${counts.categories} categories, ${counts.skills} skills\n` +
      `  ${counts.states} states, ${counts.districts} districts, ` +
      `${counts.cities} cities, ${counts.localities} localities\n\n`,
  );
}

main()
  .catch((error: unknown) => {
    logger.error({ err: error }, 'Seed failed');
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
