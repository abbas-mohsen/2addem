import { Router } from 'express';
import * as talentController from '../controllers/talent.controller.js';
import { requireAuth, requireCompany, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  saveCandidateSchema,
  talentQuerySchema,
  updateSavedCandidateSchema,
} from '../validators/talent.validator.js';

const router = Router();

router.use(requireAuth, requireRole('recruiter', 'admin'), requireCompany);

router.get('/', validate({ query: talentQuerySchema }), talentController.listPool);
router.get('/ids', talentController.savedCandidateIds);
router.post('/', validate({ body: saveCandidateSchema }), talentController.saveCandidate);
router.patch(
  '/:id',
  validate({ body: updateSavedCandidateSchema }),
  talentController.updateSaved
);
router.delete('/:id', talentController.removeSaved);

export default router;
