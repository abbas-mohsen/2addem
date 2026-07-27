import { Router } from 'express';
import * as jobController from '../controllers/job.controller.js';
import * as applicationController from '../controllers/application.controller.js';
import { optionalAuth, requireAuth, requireCompany, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadResume } from '../middleware/upload.js';
import {
  aiDraftSchema,
  createJobSchema,
  jobStatusSchema,
  listJobsQuerySchema,
  myJobsQuerySchema,
  updateJobSchema,
} from '../validators/job.validator.js';
import {
  createApplicationSchema,
  jobApplicationsQuerySchema,
} from '../validators/application.validator.js';

const router = Router();

const recruiterOnly = [requireAuth, requireRole('recruiter', 'admin'), requireCompany];

// Public board.
router.get('/', validate({ query: listJobsQuerySchema }), jobController.listJobs);

// Declared before /:slugOrId so "mine" is never treated as a slug.
router.get(
  '/mine',
  requireAuth,
  requireRole('recruiter', 'admin'),
  requireCompany,
  validate({ query: myJobsQuerySchema }),
  jobController.listMyJobs
);

router.post('/', recruiterOnly, validate({ body: createJobSchema }), jobController.createJob);

// Stubbed generation — see services/ai.service.js.
router.post(
  '/ai-draft',
  recruiterOnly,
  validate({ body: aiDraftSchema }),
  jobController.draftWithAi
);

router.get('/:slugOrId', optionalAuth, jobController.getJob);

router.patch('/:id', recruiterOnly, validate({ body: updateJobSchema }), jobController.updateJob);
router.patch(
  '/:id/status',
  recruiterOnly,
  validate({ body: jobStatusSchema }),
  jobController.updateJobStatus
);
router.delete('/:id', recruiterOnly, jobController.deleteJob);

// Applications scoped to a job.
router.post(
  '/:id/apply',
  requireAuth,
  requireRole('candidate'),
  uploadResume,
  validate({ body: createApplicationSchema }),
  applicationController.applyToJob
);

router.get(
  '/:id/applications',
  ...recruiterOnly,
  validate({ query: jobApplicationsQuerySchema }),
  applicationController.listApplicationsForJob
);

export default router;
