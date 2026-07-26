import { z } from 'zod';
import { APPLICATION_STAGES } from '../models/Application.js';

/* Multipart bodies arrive as strings, so JSON-encoded fields are parsed here
   before validation rather than in the controller. */
const jsonField = (schema, fallback) =>
  z
    .preprocess((value) => {
      if (typeof value !== 'string') return value ?? fallback;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }, schema)
    .default(fallback);

export const createApplicationSchema = z.object({
  coverLetter: z.string().trim().max(8000).default(''),
  answers: jsonField(
    z.array(
      z.object({
        question: z.string().trim().min(1).max(300),
        answer: z.string().trim().max(4000).default(''),
      })
    ),
    []
  ),
});

export const stageSchema = z.object({
  stage: z.enum(APPLICATION_STAGES),
});

export const noteSchema = z.object({
  body: z.string().trim().min(1, 'Note cannot be empty').max(4000),
});

export const tagsSchema = z.object({
  tags: z.array(z.string().trim().min(1).max(30)).max(20),
});

export const scoreSchema = z.object({
  score: z.coerce.number().min(0).max(5).nullable(),
});

export const jobApplicationsQuerySchema = z.object({
  stage: z.enum(APPLICATION_STAGES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const myApplicationsQuerySchema = z.object({
  status: z.enum(['active', 'withdrawn']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
