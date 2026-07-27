import { Router } from 'express';
import * as companyController from '../controllers/company.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateCompanySchema, upsertCompanySchema } from '../validators/company.validator.js';

const router = Router();

const recruiterOnly = [requireAuth, requireRole('recruiter', 'admin')];

router.get('/mine', ...recruiterOnly, companyController.getMyCompany);
router.get('/mine/stats', ...recruiterOnly, companyController.getMyStats);
router.post(
  '/',
  ...recruiterOnly,
  validate({ body: upsertCompanySchema }),
  companyController.createCompany
);
router.patch(
  '/mine',
  ...recruiterOnly,
  validate({ body: updateCompanySchema }),
  companyController.updateMyCompany
);

// Public career page — keep last so it does not shadow /mine.
router.get('/:slug', companyController.getCompanyBySlug);

export default router;
