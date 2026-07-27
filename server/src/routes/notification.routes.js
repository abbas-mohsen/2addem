import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { notificationQuerySchema } from '../validators/notification.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/', validate({ query: notificationQuerySchema }), notificationController.list);
router.patch('/read-all', notificationController.readAll);
router.patch('/:id/read', notificationController.read);

export default router;
