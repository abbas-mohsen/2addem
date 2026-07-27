import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  adminJobsQuerySchema,
  adminListQuerySchema,
  adminUsersQuerySchema,
  setActiveSchema,
} from '../validators/admin.validator.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/overview', adminController.overview);

router.get('/users', validate({ query: adminUsersQuerySchema }), adminController.listUsers);
router.patch(
  '/users/:id/active',
  validate({ body: setActiveSchema }),
  adminController.setUserActive
);

router.get('/jobs', validate({ query: adminJobsQuerySchema }), adminController.listJobs);
router.patch('/jobs/:id/takedown', adminController.takeDownJob);
router.delete('/jobs/:id', adminController.deleteJob);

router.get('/companies', validate({ query: adminListQuerySchema }), adminController.listCompanies);

export default router;
