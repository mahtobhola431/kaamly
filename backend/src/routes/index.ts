import { Router } from 'express';
import { BRAND } from '@rokdajob/shared';
import { env } from '@/config/env';
import { adminRouter } from '@/modules/admin/admin.routes';
import { meRouter } from '@/modules/applications/application.routes';
import { authRouter } from '@/modules/auth/auth.routes';
import { catalogRouter } from '@/modules/catalog/catalog.routes';
import { employerRouter } from '@/modules/employer/employer.routes';
import { jobRouter } from '@/modules/jobs/job.routes';
import { conversationRouter } from '@/modules/messaging/messaging.routes';
import { workerRouter } from '@/modules/workers/worker.routes';
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
apiRouter.use('/catalog', catalogRouter);
apiRouter.use('/workers', workerRouter);
apiRouter.use('/jobs', jobRouter);
apiRouter.use('/employer', employerRouter);
apiRouter.use('/me', meRouter);
apiRouter.use('/conversations', conversationRouter);

// Registered in later phases:
//   apiRouter.use('/notifications', notifyRouter); // Phase 13
