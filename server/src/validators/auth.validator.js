import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long');

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name is required').max(120),
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    password,
    // Admins are provisioned out-of-band, never through public registration.
    role: z.enum(['candidate', 'recruiter']).default('candidate'),
    companyName: z.string().trim().min(2).max(140).optional(),
  })
  .refine((data) => data.role !== 'recruiter' || Boolean(data.companyName), {
    message: 'Company name is required for recruiter accounts',
    path: ['companyName'],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  locale: z.enum(['en', 'ar']).optional(),
  avatarUrl: z.string().trim().url().or(z.literal('')).optional(),
  profile: z
    .object({
      headline: z.string().trim().max(160).optional(),
      bio: z.string().trim().max(4000).optional(),
      location: z.string().trim().max(120).optional(),
      phone: z
        .string()
        .trim()
        .max(32)
        .regex(/^[+0-9 ()-]*$/, 'Use digits, spaces and + only')
        .optional(),
      skills: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
      // null clears the field. The null branch has to come first: z.coerce
      // would otherwise turn null into 0 and store "no experience".
      experienceYears: z.union([z.null(), z.coerce.number().min(0).max(60)]).optional(),
      links: z
        .object({
          website: z.string().trim().url().or(z.literal('')).optional(),
          linkedin: z.string().trim().url().or(z.literal('')).optional(),
          github: z.string().trim().url().or(z.literal('')).optional(),
        })
        .optional(),
    })
    .optional(),
});
