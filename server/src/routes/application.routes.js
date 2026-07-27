import { Router } from 'express';
import * as applicationController from '../controllers/application.controller.js';
import * as interviewController from '../controllers/interview.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  myApplicationsQuerySchema,
  noteSchema,
  scoreSchema,
  stageSchema,
  tagsSchema,
} from '../validators/application.validator.js';
import { createInterviewSchema } from '../validators/interview.validator.js';

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

router.get('/:id', recruiterOnly, applicationController.getApplication);

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

router.get('/:id/interviews', recruiterOnly, interviewController.listForApplication);
router.post(
  '/:id/interviews',
  recruiterOnly,
  validate({ body: createInterviewSchema }),
  interviewController.createInterview
);

export default router;
