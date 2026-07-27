import mongoose from 'mongoose';
import { Interview } from '../models/Interview.js';
import { Job } from '../models/Job.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { ApiError } from '../utils/ApiError.js';
import { interviewScheduledEmail } from './email.service.js';
import { notifyInterviewCancelled, notifyInterviewScheduled } from './notification.service.js';

const POPULATE = [
  { path: 'job', select: 'title slug' },
  { path: 'company', select: 'name slug logoUrl' },
  { path: 'candidate', select: 'name email avatarUrl' },
  { path: 'interviewers', select: 'name email' },
];

export async function scheduleInterview({ application, user, payload }) {
  const interview = await Interview.create({
    application: application._id,
    job: application.job,
    company: application.company,
    candidate: application.candidate,
    interviewers: [user._id],
    createdBy: user._id,
    ...payload,
  });

  await notifyBothChannels(interview, 'scheduled');

  return interview.populate(POPULATE);
}

export async function listCandidateInterviews({ candidateId, upcoming, limit }) {
  const filter = { candidate: candidateId, status: 'scheduled' };
  if (upcoming) filter.scheduledFor = { $gte: new Date() };

  return Interview.find(filter)
    .populate([
      { path: 'job', select: 'title slug' },
      { path: 'company', select: 'name slug logoUrl' },
    ])
    .sort({ scheduledFor: 1 })
    .limit(limit)
    .lean();
}

export function listApplicationInterviews(applicationId) {
  return Interview.find({ application: applicationId })
    .populate({ path: 'interviewers', select: 'name email' })
    .sort({ scheduledFor: 1 })
    .lean();
}

export async function findInterviewForRecruiter(interviewId, user) {
  if (!mongoose.isValidObjectId(interviewId)) throw ApiError.notFound('Interview not found');

  const interview = await Interview.findById(interviewId);
  if (!interview) throw ApiError.notFound('Interview not found');

  const owns = user.company && String(interview.company) === String(user.company);
  if (user.role !== 'admin' && !owns) {
    throw ApiError.forbidden('This interview belongs to another company');
  }

  return interview;
}

/* Both the email and the in-app notification are best-effort side effects. */
export async function notifyBothChannels(interview, event) {
  const [candidate, job, company] = await Promise.all([
    User.findById(interview.candidate).select('name email').lean(),
    Job.findById(interview.job).select('title').lean(),
    Company.findById(interview.company).select('name').lean(),
  ]);

  if (!candidate || !job || !company) return;

  if (event === 'scheduled') {
    interviewScheduledEmail({ candidate, job, company, interview });
    notifyInterviewScheduled({
      candidateId: candidate._id,
      job,
      company,
      scheduledFor: interview.scheduledFor,
    });
    return;
  }

  notifyInterviewCancelled({ candidateId: candidate._id, job, company });
}

export const INTERVIEW_POPULATE = POPULATE;
