import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPageMeta, sendData, sendList } from '../utils/respond.js';
import { storage, toPublicUrl } from '../services/storage.service.js';
import { getPublicJob, findOwnedJob } from '../services/job.service.js';
import {
  createApplication,
  findApplicationForCandidate,
  findApplicationForRecruiter,
  listCandidateApplications,
  listJobApplications,
  populateApplication,
} from '../services/application.service.js';

export const applyToJob = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('A resume file is required');

  const job = await getPublicJob(req.params.id).catch(async (error) => {
    // The upload already hit disk, so clean it up before bailing out.
    await storage.remove(req.file.filename);
    throw error;
  });

  try {
    const application = await createApplication({
      job,
      candidateId: req.user._id,
      resumeUrl: toPublicUrl(req.file),
      resumeName: req.file.originalname,
      body: req.body,
    });

    sendData(res, { application }, 201);
  } catch (error) {
    await storage.remove(req.file.filename);
    throw error;
  }
});

export const listMyApplications = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;
  const { items, total } = await listCandidateApplications({
    candidateId: req.user._id,
    status,
    page,
    limit,
  });

  sendList(res, items, buildPageMeta({ page, limit, total }));
});

export const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await findApplicationForCandidate(req.params.id, req.user);

  if (application.status === 'withdrawn') throw ApiError.badRequest('Already withdrawn');
  if (['hired', 'rejected'].includes(application.stage)) {
    throw ApiError.badRequest('This application has already been decided');
  }

  application.status = 'withdrawn';
  await application.save();

  sendData(res, { application });
});

export const listApplicationsForJob = asyncHandler(async (req, res) => {
  await findOwnedJob(req.params.id, req.user);

  const { page, limit, stage } = req.query;
  const { items, total } = await listJobApplications({ jobId: req.params.id, stage, page, limit });

  sendList(res, items, buildPageMeta({ page, limit, total }));
});

export const updateStage = asyncHandler(async (req, res) => {
  const application = await findApplicationForRecruiter(req.params.id, req.user);

  if (application.status === 'withdrawn') {
    throw ApiError.badRequest('This candidate withdrew their application');
  }

  application.stage = req.body.stage;
  await application.save();

  sendData(res, { application: await populateApplication(application) });
});

export const addNote = asyncHandler(async (req, res) => {
  const application = await findApplicationForRecruiter(req.params.id, req.user);

  application.notes.push({ author: req.user._id, body: req.body.body });
  await application.save();

  sendData(res, { application: await populateApplication(application) }, 201);
});

export const updateTags = asyncHandler(async (req, res) => {
  const application = await findApplicationForRecruiter(req.params.id, req.user);

  application.tags = [...new Set(req.body.tags.map((tag) => tag.toLowerCase()))];
  await application.save();

  sendData(res, { application: await populateApplication(application) });
});

export const updateScore = asyncHandler(async (req, res) => {
  const application = await findApplicationForRecruiter(req.params.id, req.user);

  application.score = req.body.score;
  await application.save();

  sendData(res, { application: await populateApplication(application) });
});
