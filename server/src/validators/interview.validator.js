import { z } from 'zod';
import { INTERVIEW_LOCATION_TYPES, INTERVIEW_STATUSES } from '../models/Interview.js';

const base = z.object({
  scheduledFor: z.coerce.date(),
  durationMins: z.coerce.number().int().min(5).max(480).default(45),
  locationType: z.enum(INTERVIEW_LOCATION_TYPES).default('video'),
  location: z.string().trim().max(500).default(''),
  notes: z.string().trim().max(4000).default(''),
});

// Scheduling something in the past is almost always a mistake, not an intent.
const notInThePast = (data, ctx) => {
  if (data.scheduledFor && data.scheduledFor.getTime() < Date.now() - 60_000) {
    ctx.addIssue({
      code: 'custom',
      path: ['scheduledFor'],
      message: 'Pick a time in the future',
    });
  }
};

export const createInterviewSchema = base.superRefine(notInThePast);

export const updateInterviewSchema = base
  .partial()
  .extend({ status: z.enum(INTERVIEW_STATUSES).optional() })
  .superRefine((data, ctx) => {
    // Only guard the date when it is actually being changed.
    if (data.scheduledFor) notInThePast(data, ctx);
  });

export const interviewQuerySchema = z.object({
  upcoming: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
