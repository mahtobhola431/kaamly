import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { LIMITS } from '@rokdajob/shared';
import { env, isProduction, isTest } from '@/config/env';
import { logger } from '@/config/logger';
import { errorHandler, notFoundHandler } from '@/middleware/error-handler';
import { globalLimiter } from '@/middleware/rate-limit';
import { apiRouter } from '@/routes';

export function createApp(): Express {
  const app = express();

  // Behind Nginx / Render / Railway the client IP arrives in X-Forwarded-For.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin, curl and server-to-server requests carry no Origin header.
        if (!origin || env.CORS_ORIGINS.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      maxAge: 86_400,
    }),
  );

  app.use(express.json({ limit: LIMITS.jsonBodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: LIMITS.jsonBodyLimit }));
  app.use(cookieParser());
  app.use(compression());

  // Strips `$` and `.` from user input so a crafted body cannot become a query operator.
  app.use(mongoSanitize({ replaceWith: '_' }));

  if (!isTest) {
    app.use(
      pinoHttp({
        logger,
        autoLogging: {
          ignore: (req) => req.url?.startsWith(`${env.API_PREFIX}/health`) ?? false,
        },
        customLogLevel: (_req, res, err) => {
          if (err || res.statusCode >= 500) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },
      }),
    );
  }

  app.use(env.API_PREFIX, globalLimiter, apiRouter);

  app.get('/', (_req, res) => {
    res.redirect(`${env.API_PREFIX}/health`);
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
