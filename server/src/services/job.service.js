import mongoose from 'mongoose';
import { Job } from '../models/Job.js';
import { Company } from '../models/Company.js';
import { ApiError } from '../utils/ApiError.js';
import { uniqueSlug } from '../utils/slug.js';

const PUBLIC_FIELDS =
  'title slug company location remote employmentType salaryMin salaryMax currency skills status applicationCount views publishedAt createdAt';

export async function buildJobSlug(title) {
  return uniqueSlug(title, async (candidate) => Boolean(await Job.exists({ slug: candidate })));
}

/* Translates validated query params into a Mongo filter for the public board. */
async function buildPublicFilter(query) {
  const filter = { status: 'published' };

  if (query.q) filter.$text = { $search: query.q };
  if (query.remote) filter.remote = query.remote;
  if (query.employmentType) filter.employmentType = query.employmentType;
  if (query.location) filter.location = { $regex: escapeRegex(query.location), $options: 'i' };
  if (query.skills?.length) {
    filter.skills = { $in: query.skills.map((s) => new RegExp(`^${escapeRegex(s)}$`, 'i')) };
  }
  if (query.salaryMin != null) filter.salaryMax = { $gte: query.salaryMin };

  if (query.company) {
    const company = await Company.findOne({ slug: query.company }).select('_id').lean();
    // An unknown company slug must yield zero results, not every job.
    filter.company = company?._id ?? new mongoose.Types.ObjectId();
  }

  return filter;
}

const SORTS = {
  newest: { publishedAt: -1, createdAt: -1 },
  oldest: { publishedAt: 1, createdAt: 1 },
  salary: { salaryMax: -1, publishedAt: -1 },
};

export async function listPublicJobs(query) {
  const filter = await buildPublicFilter(query);
  const skip = (query.page - 1) * query.limit;

  const [items, total] = await Promise.all([
    Job.find(filter)
      .select(PUBLIC_FIELDS)
      .populate('company', 'name slug logoUrl location industry')
      .sort(SORTS[query.sort])
      .skip(skip)
      .limit(query.limit)
      .lean(),
    Job.countDocuments(filter),
  ]);

  return { items, total };
}

export async function getPublicJob(slugOrId) {
  const conditions = [{ slug: String(slugOrId).toLowerCase() }];
  if (mongoose.isValidObjectId(slugOrId)) conditions.push({ _id: slugOrId });

  const job = await Job.findOne({ $or: conditions, status: { $ne: 'draft' } }).populate(
    'company',
    'name slug logoUrl website description location industry size'
  );

  if (!job) throw ApiError.notFound('This job is no longer available');
  return job;
}

export async function listCompanyJobs({ companyId, status, page, limit }) {
  const filter = { company: companyId };
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    Job.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter),
  ]);

  return { items, total };
}

/* Recruiters may only ever reach jobs belonging to their own company; admins
   bypass the ownership check for moderation. */
export async function findOwnedJob(jobId, user) {
  if (!mongoose.isValidObjectId(jobId)) throw ApiError.notFound('Job not found');

  const job = await Job.findById(jobId);
  if (!job) throw ApiError.notFound('Job not found');

  const ownsJob = user.company && String(job.company) === String(user.company);
  if (user.role !== 'admin' && !ownsJob) {
    throw ApiError.forbidden('This job belongs to another company');
  }

  return job;
}

export function applyStatusTransition(job, status) {
  job.status = status;
  // publishedAt is set once, the first time a job goes live, so re-publishing
  // an old job does not make it look brand new on the board.
  if (status === 'published' && !job.publishedAt) job.publishedAt = new Date();
  return job;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
