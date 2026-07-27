import { Notification } from '../models/Notification.js';
import { logger } from '../utils/logger.js';
import { STAGE_LABELS } from '../utils/labels.js';

/* In-app notifications sit alongside email: same events, but they must never
   break the request that produced them, so every helper swallows its errors.

   Each notification stores a type plus the values that vary, so the client can
   render it in whichever language the reader has chosen. `message` is the
   English rendering, kept as a fallback. */
async function create({ user, type, message, params = {}, link = '' }) {
  try {
    return await Notification.create({ user, type, message, params, link });
  } catch (error) {
    logger.error(`Notification "${type}" for ${user} failed: ${error.message}`);
    return null;
  }
}

export function notifyApplicationSubmitted({ candidateId, job, company }) {
  return create({
    user: candidateId,
    type: 'application_submitted',
    params: { company: company.name, job: job.title },
    message: `Your application to ${company.name} for ${job.title} was sent.`,
    link: '/applications',
  });
}

export function notifyApplicationReceived({ recruiterId, candidateName, job }) {
  return create({
    user: recruiterId,
    type: 'application_received',
    params: { name: candidateName, job: job.title },
    message: `${candidateName} applied for ${job.title}.`,
    link: `/recruiter/jobs/${job._id}/pipeline`,
  });
}

export function notifyStageChanged({ candidateId, job, company, stage }) {
  return create({
    user: candidateId,
    type: 'stage_changed',
    // The stage key travels raw so the client can translate the label itself.
    params: { company: company.name, job: job.title, stage },
    message: `${company.name} moved your ${job.title} application to ${STAGE_LABELS[stage]}.`,
    link: '/applications',
  });
}

export function notifyInterviewScheduled({ candidateId, job, company, scheduledFor }) {
  const when = new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(scheduledFor));

  return create({
    user: candidateId,
    type: 'interview_scheduled',
    // ISO string so the client can format it in the reader's locale.
    params: { company: company.name, job: job.title, scheduledFor: new Date(scheduledFor).toISOString() },
    message: `${company.name} scheduled an interview for ${job.title} on ${when}.`,
    link: '/applications',
  });
}

export function notifyInterviewCancelled({ candidateId, job, company }) {
  return create({
    user: candidateId,
    type: 'interview_cancelled',
    params: { company: company.name, job: job.title },
    message: `${company.name} cancelled your interview for ${job.title}.`,
    link: '/applications',
  });
}

export function notifyJobTakenDown({ recruiterId, jobTitle }) {
  return create({
    user: recruiterId,
    type: 'job_taken_down',
    params: { job: jobTitle },
    message: `Your job "${jobTitle}" was taken down by a moderator.`,
    link: '/recruiter/jobs',
  });
}

export async function listNotifications({ userId, unreadOnly = false, limit = 20 }) {
  const filter = { user: userId };
  if (unreadOnly) filter.read = false;

  const [items, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
    Notification.countDocuments({ user: userId, read: false }),
  ]);

  return { items, unreadCount };
}

export function markRead(userId, notificationId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { read: true },
    { new: true }
  );
}

export function markAllRead(userId) {
  return Notification.updateMany({ user: userId, read: false }, { read: true });
}
