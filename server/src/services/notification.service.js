import { Notification } from '../models/Notification.js';
import { logger } from '../utils/logger.js';

/* In-app notifications sit alongside email: same events, but they must never
   break the request that produced them, so every helper swallows its errors. */
async function create({ user, type, message, link = '' }) {
  try {
    return await Notification.create({ user, type, message, link });
  } catch (error) {
    logger.error(`Notification "${type}" for ${user} failed: ${error.message}`);
    return null;
  }
}

export function notifyApplicationSubmitted({ candidateId, job, company }) {
  return create({
    user: candidateId,
    type: 'application_submitted',
    message: `Your application to ${company.name} for ${job.title} was sent.`,
    link: '/applications',
  });
}

export function notifyApplicationReceived({ recruiterId, candidateName, job }) {
  return create({
    user: recruiterId,
    type: 'application_received',
    message: `${candidateName} applied for ${job.title}.`,
    link: `/recruiter/jobs/${job._id}/pipeline`,
  });
}

export function notifyStageChanged({ candidateId, job, company, stageLabel }) {
  return create({
    user: candidateId,
    type: 'stage_changed',
    message: `${company.name} moved your ${job.title} application to ${stageLabel}.`,
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
    message: `${company.name} scheduled an interview for ${job.title} on ${when}.`,
    link: '/applications',
  });
}

export function notifyInterviewCancelled({ candidateId, job, company }) {
  return create({
    user: candidateId,
    type: 'interview_cancelled',
    message: `${company.name} cancelled your interview for ${job.title}.`,
    link: '/applications',
  });
}

export function notifyJobTakenDown({ recruiterId, jobTitle }) {
  return create({
    user: recruiterId,
    type: 'job_taken_down',
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
