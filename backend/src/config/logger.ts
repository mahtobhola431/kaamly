import pino from 'pino';
import { env, isProduction } from './env';

/**
 * Structured logging. Pretty in development, JSON in production so a log shipper can parse it.
 * Credentials and tokens are redacted at the logger level rather than at each call site.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'passwordHash',
      '*.password',
      '*.passwordHash',
      'accessToken',
      'refreshToken',
      'code',
    ],
    censor: '[redacted]',
  },
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
        },
      }),
});

export type Logger = typeof logger;
