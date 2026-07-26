import { Company } from '../models/Company.js';
import { Job } from '../models/Job.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendData } from '../utils/respond.js';
import { uniqueSlug } from '../utils/slug.js';

export const getCompanyBySlug = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ slug: req.params.slug.toLowerCase() });
  if (!company) throw ApiError.notFound('Company not found');

  const jobs = await Job.find({ company: company._id, status: 'published' })
    .select('title slug location remote employmentType salaryMin salaryMax currency publishedAt')
    .sort({ publishedAt: -1 })
    .lean();

  sendData(res, { company, jobs });
});

export const getMyCompany = asyncHandler(async (req, res) => {
  const company = req.user.company ? await Company.findById(req.user.company) : null;
  sendData(res, { company });
});

export const createCompany = asyncHandler(async (req, res) => {
  if (req.user.company) throw ApiError.conflict('You already belong to a company');

  const slug = await uniqueSlug(req.body.name, async (candidate) =>
    Boolean(await Company.exists({ slug: candidate }))
  );
  const company = await Company.create({ ...req.body, slug, createdBy: req.user._id });

  req.user.company = company._id;
  await req.user.save();

  sendData(res, { company }, 201);
});

export const updateMyCompany = asyncHandler(async (req, res) => {
  const company = req.user.company ? await Company.findById(req.user.company) : null;
  if (!company) throw ApiError.notFound('You do not have a company profile yet');

  Object.assign(company, req.body);
  await company.save();

  sendData(res, { company });
});
