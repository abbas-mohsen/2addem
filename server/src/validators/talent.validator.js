import { z } from 'zod';

export const saveCandidateSchema = z.object({
  candidateId: z.string().trim().min(1, 'A candidate is required'),
  sourceApplication: z.string().trim().optional(),
  note: z.string().trim().max(2000).default(''),
  tags: z.array(z.string().trim().min(1).max(30)).max(20).default([]),
});

export const updateSavedCandidateSchema = z.object({
  note: z.string().trim().max(2000).optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(20).optional(),
});

export const talentQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  tag: z.string().trim().max(30).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
