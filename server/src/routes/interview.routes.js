import { Router } from 'express';
import * as interviewController from '../controllers/interview.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  interviewQuerySchema,
  updateInterviewSchema,
} from '../validators/interview.validator.js';

const router = Router();

router.use(requireAuth);

// Declared before /:id so "mine" is never read as an id.
router.get(
  '/mine',
  requireRole('candidate'),
  validate({ query: interviewQuerySchema }),
  interviewController.listMine
);

const recruiterOnly = requireRole('recruiter', 'admin');

router.patch(
  '/:id',
  recruiterOnly,
  validate({ body: updateInterviewSchema }),
  interviewController.updateInterview
);
router.delete('/:id', recruiterOnly, interviewController.deleteInterview);

export default router;
