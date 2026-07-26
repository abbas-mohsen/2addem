import { Router } from 'express';
import * as applicationController from '../controllers/application.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  myApplicationsQuerySchema,
  noteSchema,
  scoreSchema,
  stageSchema,
  tagsSchema,
} from '../validators/application.validator.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/mine',
  requireRole('candidate'),
  validate({ query: myApplicationsQuerySchema }),
  applicationController.listMyApplications
);

router.patch(
  '/:id/withdraw',
  requireRole('candidate'),
  applicationController.withdrawApplication
);

const recruiterOnly = requireRole('recruiter', 'admin');

router.patch(
  '/:id/stage',
  recruiterOnly,
  validate({ body: stageSchema }),
  applicationController.updateStage
);
router.post(
  '/:id/notes',
  recruiterOnly,
  validate({ body: noteSchema }),
  applicationController.addNote
);
router.patch(
  '/:id/tags',
  recruiterOnly,
  validate({ body: tagsSchema }),
  applicationController.updateTags
);
router.patch(
  '/:id/score',
  recruiterOnly,
  validate({ body: scoreSchema }),
  applicationController.updateScore
);

export default router;
