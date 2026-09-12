import { Router } from 'express';
import { BRAND } from '@rokdajob/shared';
import { env } from '@/config/env';
import { adminRouter } from '@/modules/admin/admin.routes';
import { authRouter } from '@/modules/auth/auth.routes';
import { healthRouter } from '@/modules/health/health.routes';

/**
 * Single mount point for the versioned API. Feature routers are registered here as each
 * phase lands, so there is one place to see the whole surface.
 */
export const apiRouter = Router();

apiRouter.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: `${BRAND.name} API`,
      version: 'v1',
      environment: env.NODE_ENV,
      docs: '/docs/02-API.md',
    },
  });
});

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin', adminRouter);

// Registered in later phases:
//   apiRouter.use('/workers', workerRouter);       // Phase 5, 8
//   apiRouter.use('/employer', employerRouter);    // Phase 6, 10
//   apiRouter.use('/jobs', jobRouter);             // Phase 7, 9
//   apiRouter.use('/conversations', chatRouter);   // Phase 12
//   apiRouter.use('/notifications', notifyRouter); // Phase 13
//   apiRouter.use('/catalog', catalogRouter);      // Phase 16
