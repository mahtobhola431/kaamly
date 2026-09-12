import mongoose from 'mongoose';
import { env, isProduction } from '@/config/env';
import { logger } from '@/config/logger';

mongoose.set('strictQuery', true);

/** Surfaces slow or unindexed queries during development. */
if (!isProduction) {
  mongoose.set('debug', (collection: string, method: string, query: unknown) => {
    logger.debug({ collection, method, query }, 'mongoose');
  });
}

export interface ConnectionState {
  connected: boolean;
  /** Whether the deployment supports multi-document transactions (docs/06-RISKS.md R12). */
  supportsTransactions: boolean;
  host?: string;
  dbName?: string;
}

const state: ConnectionState = { connected: false, supportsTransactions: false };

export function getConnectionState(): Readonly<ConnectionState> {
  return {
    ...state,
    connected: mongoose.connection.readyState === mongoose.ConnectionStates.connected,
  };
}

/**
 * Detects replica-set / sharded topology. Standalone MongoDB rejects transactions, so the
 * hire flow degrades to a guarded atomic update instead of crashing on a dev machine.
 */
async function detectTransactionSupport(): Promise<boolean> {
  try {
    const admin = mongoose.connection.db?.admin();
    if (!admin) return false;
    const info = (await admin.command({ hello: 1 })) as { setName?: string; msg?: string };
    return Boolean(info.setName) || info.msg === 'isdbgrid';
  } catch {
    return false;
  }
}

export async function connectDatabase(): Promise<ConnectionState> {
  if (mongoose.connection.readyState === mongoose.ConnectionStates.connected)
    return getConnectionState();

  mongoose.connection.on('error', (error) => logger.error({ err: error }, 'MongoDB error'));
  mongoose.connection.on('disconnected', () => {
    state.connected = false;
    logger.warn('MongoDB disconnected');
  });
  mongoose.connection.on('reconnected', () => {
    state.connected = true;
    logger.info('MongoDB reconnected');
  });

  await mongoose.connect(env.MONGODB_URI, {
    ...(env.MONGODB_DB_NAME ? { dbName: env.MONGODB_DB_NAME } : {}),
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 20,
    minPoolSize: 2,
    retryWrites: true,
  });

  state.connected = true;
  state.host = mongoose.connection.host;
  state.dbName = mongoose.connection.name;
  state.supportsTransactions = await detectTransactionSupport();

  logger.info(
    { host: state.host, db: state.dbName, transactions: state.supportsTransactions },
    'MongoDB connected',
  );

  return getConnectionState();
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === mongoose.ConnectionStates.disconnected) return;
  await mongoose.disconnect();
  state.connected = false;
  logger.info('MongoDB disconnected');
}

/**
 * Runs `work` inside a transaction where the deployment supports one, and directly
 * otherwise. Callers must therefore still write idempotent, guarded updates.
 */
export async function withTransaction<T>(
  work: (session: mongoose.ClientSession | undefined) => Promise<T>,
): Promise<T> {
  if (!state.supportsTransactions) return work(undefined);

  const session = await mongoose.startSession();
  try {
    let result: T;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result!;
  } finally {
    await session.endSession();
  }
}
