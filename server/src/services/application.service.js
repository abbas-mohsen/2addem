import mongoose from 'mongoose';
import { Application } from '../models/Application.js';
import { Job } from '../models/Job.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { ApiError } from '../utils/ApiError.js';
import {
  applicationReceivedEmail,
  newApplicantEmail,
  stageChangedEmail,
} from './email.service.js';

const CANDIDATE_CARD_FIELDS = 'name email avatarUrl profile.headline profile.location profile.skills';

export async function createApplication({ job, candidateId, resumeUrl, resumeName, body }) {
  if (job.status !== 'published') throw ApiError.badRequest('This job is not accepting applications');

  const duplicate = await Application.exists({ job: job._id, candidate: candidateId });
  if (duplicate) throw ApiError.conflict('You have already applied to this job');

  const application = await Application.create({
    job: job._id,
    candidate: candidateId,
    company: job.company._id ?? job.company,
    resumeUrl,
    resumeName,
    coverLetter: body.coverLetter,
    answers: body.answers,
  });

  await Job.updateOne({ _id: job._id }, { $inc: { applicationCount: 1 } });

  return application;
}

export async function listCandidateApplications({ candidateId, status, page, limit }) {
  const filter = { candidate: candidateId };
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    Application.find(filter)
      .populate({
        path: 'job',
        select: 'title slug location remote employmentType status',
        populate: { path: 'company', select: 'name slug logoUrl' },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter),
  ]);

  return { items, total };
}

export async function listJobApplications({ jobId, stage, page, limit }) {
  const filter = { job: jobId };
  if (stage) filter.stage = stage;

  const [items, total] = await Promise.all([
    Application.find(filter)
      .populate('candidate', CANDIDATE_CARD_FIELDS)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter),
  ]);

  return { items, total };
}

/* Recruiters reach applications through their company; admins bypass the check. */
export async function findApplicationForRecruiter(applicationId, user) {
  const application = await loadApplication(applicationId);

  const ownsApplication = user.company && String(application.company) === String(user.company);
  if (user.role !== 'admin' && !ownsApplication) {
    throw ApiError.forbidden('This application belongs to another company');
  }

  return application;
}

export async function findApplicationForCandidate(applicationId, user) {
  const application = await loadApplication(applicationId);

  if (String(application.candidate) !== String(user._id)) {
    throw ApiError.forbidden('This application belongs to another candidate');
  }

  return application;
}

async function loadApplication(applicationId) {
  if (!mongoose.isValidObjectId(applicationId)) throw ApiError.notFound('Application not found');

  const application = await Application.findById(applicationId);
  if (!application) throw ApiError.notFound('Application not found');

  return application;
}

export function populateApplication(application) {
  return application.populate([
    { path: 'candidate', select: CANDIDATE_CARD_FIELDS },
    { path: 'notes.author', select: 'name avatarUrl' },
  ]);
}

/* Notifications are deliberately not awaited by callers: a mail outage must
   never turn a successful application into a failed request. */
export async function notifyNewApplication({ job, candidate }) {
  const company = job.company?.name ? job.company : await Company.findById(job.company).lean();
  if (!company) return;

  applicationReceivedEmail({ candidate, job, company });

  const recruiter = await User.findById(job.createdBy).select('email name').lean();
  if (recruiter) newApplicantEmail({ recruiter, candidate, job });
}

export async function notifyStageChange(application) {
  const [candidate, job] = await Promise.all([
    User.findById(application.candidate).select('email name').lean(),
    Job.findById(application.job).select('title').lean(),
  ]);
  const company = await Company.findById(application.company).select('name').lean();

  if (!candidate || !job || !company) return;

  stageChangedEmail({ candidate, job, company, stage: application.stage });
}
