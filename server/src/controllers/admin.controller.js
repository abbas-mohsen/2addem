import { User } from '../models/User.js';
import { Job } from '../models/Job.js';
import { Company } from '../models/Company.js';
import { Application } from '../models/Application.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPageMeta, sendData, sendList } from '../utils/respond.js';
import { notifyJobTakenDown } from '../services/notification.service.js';

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const overview = asyncHandler(async (_req, res) => {
  const [users, candidates, recruiters, deactivated, companies, jobs, published, applications] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'candidate' }),
      User.countDocuments({ role: 'recruiter' }),
      User.countDocuments({ isActive: false }),
      Company.countDocuments(),
      Job.countDocuments(),
      Job.countDocuments({ status: 'published' }),
      Application.countDocuments(),
    ]);

  sendData(res, {
    stats: {
      users: { total: users, candidates, recruiters, deactivated },
      companies,
      jobs: { total: jobs, published },
      applications,
    },
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { q, role, status, page, limit } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (status) filter.isActive = status === 'active';
  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .select('name email role isActive createdAt company')
      .populate('company', 'name slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  sendList(res, items, buildPageMeta({ page, limit, total }));
});

export const setUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  // Without this an admin could lock themselves out of the panel.
  if (String(user._id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }
  if (user.role === 'admin' && !req.body.isActive) {
    throw ApiError.forbidden('Admin accounts cannot be deactivated from the panel');
  }

  user.isActive = req.body.isActive;
  // Deactivating must end existing sessions, not just block new sign-ins.
  if (!user.isActive) user.tokenVersion += 1;
  await user.save();

  sendData(res, { user });
});

export const listJobs = asyncHandler(async (req, res) => {
  const { q, status, page, limit } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (q) filter.title = new RegExp(escapeRegex(q), 'i');

  const [items, total] = await Promise.all([
    Job.find(filter)
      .select('title slug status applicationCount views createdAt company createdBy')
      .populate('company', 'name slug')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter),
  ]);

  sendList(res, items, buildPageMeta({ page, limit, total }));
});

export const takeDownJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw ApiError.notFound('Job not found');

  /* Taking down a job closes it rather than deleting it: candidates keep their
     application history, and the recruiter is told what happened. */
  job.status = 'closed';
  await job.save();

  notifyJobTakenDown({ recruiterId: job.createdBy, jobTitle: job.title });

  sendData(res, { job });
});

export const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw ApiError.notFound('Job not found');

  const applicationCount = await Application.countDocuments({ job: job._id });
  if (applicationCount > 0) {
    throw ApiError.badRequest(
      `This job has ${applicationCount} application(s). Take it down instead of deleting it.`,
      { code: 'HAS_APPLICATIONS' }
    );
  }

  await job.deleteOne();
  sendData(res, { deleted: true });
});

export const listCompanies = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const [items, total] = await Promise.all([
    Company.find()
      .select('name slug location industry size createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Company.countDocuments(),
  ]);

  sendList(res, items, buildPageMeta({ page, limit, total }));
});
