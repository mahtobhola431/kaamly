import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { BRAND } from '@rokdajob/shared';
import { env } from '@/config/env';
import { getConnectionState } from '@/database/connection';
import { ok } from '@/utils/response';

const startedAt = Date.now();

/** Liveness: the process is up. Deliberately does not touch the database. */
export const live = (_req: Request, res: Response): void => {
  res.status(200).json({ success: true, data: { status: 'ok' } });
};

/**
 * Readiness: everything this instance needs in order to serve traffic.
 * Returns 503 when the database is unreachable so a load balancer can route around it.
 */
export const ready = (_req: Request, res: Response): void => {
  const db = getConnectionState();
  const healthy = db.connected;

  const payload = {
    service: BRAND.name,
    status: healthy ? 'ok' : 'degraded',
    environment: env.NODE_ENV,
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    version: process.env.npm_package_version ?? '0.1.0',
    database: {
      connected: db.connected,
      readyState: mongoose.connection.readyState,
      host: db.host ?? null,
      name: db.dbName ?? null,
      transactions: db.supportsTransactions,
    },
    timestamp: new Date().toISOString(),
  };

  if (!healthy) {
    res.status(503).json({
      success: false,
      error: { code: 'INTERNAL', message: 'Database unavailable' },
      data: payload,
    });
    return;
  }

  ok(res, payload);
};
