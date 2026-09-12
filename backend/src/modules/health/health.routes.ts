import { Router } from 'express';
import * as controller from './health.controller';

export const healthRouter = Router();

healthRouter.get('/', controller.ready);
healthRouter.get('/live', controller.live);
healthRouter.get('/ready', controller.ready);
