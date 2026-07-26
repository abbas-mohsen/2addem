import { z } from 'zod';
import { COMPANY_SIZES } from '../models/Company.js';

export const upsertCompanySchema = z.object({
  name: z.string().trim().min(2, 'Company name is required').max(140),
  logoUrl: z.string().trim().url().or(z.literal('')).optional(),
  website: z.string().trim().url('Enter a valid URL').or(z.literal('')).optional(),
  description: z.string().trim().max(6000).optional(),
  location: z.string().trim().max(120).optional(),
  industry: z.string().trim().max(120).optional(),
  size: z.enum(COMPANY_SIZES).optional(),
});

export const updateCompanySchema = upsertCompanySchema.partial();
