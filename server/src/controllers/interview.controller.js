import { asyncHandler } from '../utils/asyncHandler.js';
import { sendData } from '../utils/respond.js';
import { ApiError } from '../utils/ApiError.js';
import { findApplicationForRecruiter } from '../services/application.service.js';
import {
  INTERVIEW_POPULATE,
  findInterviewForRecruiter,
  listApplicationInterviews,
  listCandidateInterviews,
  notifyBothChannels,
  scheduleInterview,
} from '../services/interview.service.js';

export const createInterview = asyncHandler(async (req, res) => {
  const application = await findApplicationForRecruiter(req.params.id, req.user);

  if (application.status === 'withdrawn') {
    throw ApiError.badRequest('This candidate withdrew their application');
  }

  const interview = await scheduleInterview({ application, user: req.user, payload: req.body });

  sendData(res, { interview }, 201);
});

export const listForApplication = asyncHandler(async (req, res) => {
  await findApplicationForRecruiter(req.params.id, req.user);

  sendData(res, { interviews: await listApplicationInterviews(req.params.id) });
});

export const listMine = asyncHandler(async (req, res) => {
  const { upcoming, limit } = req.query;

  sendData(res, {
    interviews: await listCandidateInterviews({ candidateId: req.user._id, upcoming, limit }),
  });
});

export const updateInterview = asyncHandler(async (req, res) => {
  const interview = await findInterviewForRecruiter(req.params.id, req.user);
  const wasScheduled = interview.status === 'scheduled';

  Object.assign(interview, req.body);
  await interview.save();

  // Only tell the candidate when a live interview actually gets called off.
  if (wasScheduled && interview.status === 'cancelled') {
    notifyBothChannels(interview, 'cancelled');
  }

  sendData(res, { interview: await interview.populate(INTERVIEW_POPULATE) });
});

export const deleteInterview = asyncHandler(async (req, res) => {
  const interview = await findInterviewForRecruiter(req.params.id, req.user);

  if (interview.status === 'scheduled') notifyBothChannels(interview, 'cancelled');
  await interview.deleteOne();

  sendData(res, { deleted: true });
});
