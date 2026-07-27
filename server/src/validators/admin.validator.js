import { z } from 'zod';
import { USER_ROLES } from '../models/User.js';
import { JOB_STATUSES } from '../models/Job.js';

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const adminUsersQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  ...pagination,
});

export const adminJobsQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(JOB_STATUSES).optional(),
  ...pagination,
});

export const adminListQuerySchema = z.object(pagination);

export const setActiveSchema = z.object({
  isActive: z.boolean(),
});
