import { z } from 'zod';
import { EMPLOYMENT_TYPES, JOB_STATUSES, REMOTE_TYPES } from '../models/Job.js';

const bulletList = z.array(z.string().trim().min(1).max(400)).max(25);

const jobBase = z.object({
  title: z.string().trim().min(3, 'Title is required').max(160),
  description: z.string().trim().min(30, 'Describe the role in at least 30 characters').max(20000),
  responsibilities: bulletList.default([]),
  requirements: bulletList.default([]),
  location: z.string().trim().max(140).default(''),
  remote: z.enum(REMOTE_TYPES).default('onsite'),
  employmentType: z.enum(EMPLOYMENT_TYPES).default('full-time'),
  salaryMin: z.coerce.number().min(0).max(100_000_000).optional(),
  salaryMax: z.coerce.number().min(0).max(100_000_000).optional(),
  currency: z.string().trim().length(3).toUpperCase().default('USD'),
  freshUsd: z.coerce.boolean().default(true),
  remoteAbroad: z.coerce.boolean().default(false),
  skills: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  status: z.enum(['draft', 'published']).default('draft'),
});

const salaryOrder = (data, ctx) => {
  if (data.salaryMin != null && data.salaryMax != null && data.salaryMin > data.salaryMax) {
    ctx.addIssue({
      code: 'custom',
      path: ['salaryMax'],
      message: 'Maximum salary must be greater than the minimum',
    });
  }
};

export const createJobSchema = jobBase.superRefine(salaryOrder);
export const updateJobSchema = jobBase.partial().superRefine(salaryOrder);

export const jobStatusSchema = z.object({
  status: z.enum(JOB_STATUSES),
});

export const listJobsQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  location: z.string().trim().max(120).optional(),
  remote: z.enum(REMOTE_TYPES).optional(),
  remoteAbroad: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
  company: z.string().trim().max(140).optional(),
  skills: z
    .string()
    .trim()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined
    ),
  salaryMin: z.coerce.number().min(0).optional(),
  sort: z.enum(['newest', 'oldest', 'salary']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const aiDraftSchema = z.object({
  title: z.string().trim().min(3, 'Give the role a title first').max(160),
  seniority: z.enum(['junior', 'mid', 'senior', 'lead']).default('mid'),
  remote: z.enum(REMOTE_TYPES).default('onsite'),
  location: z.string().trim().max(140).default(''),
  skills: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
});

export const myJobsQuerySchema = z.object({
  status: z.enum(JOB_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
