import mongoose from 'mongoose';

export const JOB_STATUSES = ['draft', 'published', 'closed'];
export const REMOTE_TYPES = ['onsite', 'hybrid', 'remote'];
// Freelance is a distinct arrangement here, not a flavour of contract.
export const EMPLOYMENT_TYPES = [
  'full-time',
  'part-time',
  'contract',
  'internship',
  'freelance',
];

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true, trim: true, maxlength: 20000 },
    responsibilities: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    location: { type: String, trim: true, maxlength: 140, default: '' },
    remote: { type: String, enum: REMOTE_TYPES, default: 'onsite', index: true },
    employmentType: { type: String, enum: EMPLOYMENT_TYPES, default: 'full-time', index: true },
    salaryMin: { type: Number, min: 0 },
    salaryMax: { type: Number, min: 0 },
    currency: { type: String, trim: true, uppercase: true, maxlength: 3, default: 'USD' },
    /* Since 2019 the lira is not how salaries are quoted here — roles advertise
       in "fresh" USD paid outside the local banking system. Recruiters can turn
       this off if they genuinely mean lira or local-bank dollars. */
    freshUsd: { type: Boolean, default: true },
    /* Remote work for a company based outside Lebanon, paid from abroad. It is
       a different proposition to remote work for a local employer, and the one
       filter candidates here ask for most. */
    remoteAbroad: { type: Boolean, default: false, index: true },
    skills: { type: [String], default: [], index: true },
    status: { type: String, enum: JOB_STATUSES, default: 'draft', index: true },
    applicationCount: { type: Number, default: 0, min: 0 },
    views: { type: Number, default: 0, min: 0 },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Public board: filter by status then sort by recency.
jobSchema.index({ status: 1, publishedAt: -1 });
// Recruiter board: a company's jobs, newest first.
jobSchema.index({ company: 1, createdAt: -1 });
// Keyword search across the fields candidates actually type into.
jobSchema.index({ title: 'text', description: 'text', skills: 'text' });

jobSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const Job = mongoose.model('Job', jobSchema);
