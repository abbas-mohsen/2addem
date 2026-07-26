import { Job } from '../models/Job.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPageMeta, sendData, sendList } from '../utils/respond.js';
import { Application } from '../models/Application.js';
import {
  applyStatusTransition,
  buildJobSlug,
  findOwnedJob,
  getPublicJob,
  listCompanyJobs,
  listPublicJobs,
} from '../services/job.service.js';

export const listJobs = asyncHandler(async (req, res) => {
  const { items, total } = await listPublicJobs(req.query);
  sendList(res, items, buildPageMeta({ page: req.query.page, limit: req.query.limit, total }));
});

export const getJob = asyncHandler(async (req, res) => {
  const job = await getPublicJob(req.params.slugOrId);

  // Fire-and-forget: a failed view counter must never break the page.
  Job.updateOne({ _id: job._id }, { $inc: { views: 1 } }).catch(() => {});

  const hasApplied = req.user
    ? Boolean(await Application.exists({ job: job._id, candidate: req.user._id }))
    : false;

  sendData(res, { job, hasApplied });
});

export const listMyJobs = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;
  const { items, total } = await listCompanyJobs({
    companyId: req.user.company,
    status,
    page,
    limit,
  });

  sendList(res, items, buildPageMeta({ page, limit, total }));
});

export const createJob = asyncHandler(async (req, res) => {
  const { status, ...fields } = req.body;

  const job = await Job.create({
    ...fields,
    status,
    slug: await buildJobSlug(fields.title),
    company: req.user.company,
    createdBy: req.user._id,
    publishedAt: status === 'published' ? new Date() : null,
  });

  sendData(res, { job }, 201);
});

export const updateJob = asyncHandler(async (req, res) => {
  const job = await findOwnedJob(req.params.id, req.user);
  const { status, ...fields } = req.body;

  Object.assign(job, fields);
  if (status) applyStatusTransition(job, status);

  await job.save();
  sendData(res, { job });
});

export const updateJobStatus = asyncHandler(async (req, res) => {
  const job = await findOwnedJob(req.params.id, req.user);
  applyStatusTransition(job, req.body.status);
  await job.save();

  sendData(res, { job });
});

export const deleteJob = asyncHandler(async (req, res) => {
  const job = await findOwnedJob(req.params.id, req.user);

  // Applications are candidates' records too, so a delete closes the posting
  // rather than destroying the application history behind it.
  const hasApplications = await Application.exists({ job: job._id });
  if (hasApplications) {
    applyStatusTransition(job, 'closed');
    await job.save();
    return sendData(res, { job, deleted: false, message: 'Job closed because it has applicants' });
  }

  await job.deleteOne();
  sendData(res, { deleted: true });
});
