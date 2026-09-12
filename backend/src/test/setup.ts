/**
 * Fills in the environment before `config/env.ts` is imported.
 *
 * That module validates `process.env` at import time and exits the process on a bad value,
 * so the variables have to exist before any application module is pulled in. Vitest runs
 * setup files ahead of the test module, which is exactly the hook needed.
 */
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'fatal';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-value-0123456789';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-value-0123456789';
process.env.JWT_ACCESS_TTL = '15m';

// Replaced per-suite by the in-memory server; env validation only needs it to be present.
process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/rokdajob-test';
process.env.COOKIE_SECURE = 'false';
process.env.APP_WEB_URL = 'http://localhost:3000';
process.env.APP_ADMIN_URL = 'http://localhost:3001';
