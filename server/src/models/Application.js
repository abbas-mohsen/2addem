import mongoose from 'mongoose';

export const APPLICATION_STAGES = [
  'applied',
  'screening',
  'interview',
  'offer',
  'hired',
  'rejected',
];
export const APPLICATION_STATUSES = ['active', 'withdrawn'];

const noteSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const answerSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 300 },
    answer: { type: String, trim: true, maxlength: 4000, default: '' },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    resumeUrl: { type: String, required: true, trim: true },
    resumeName: { type: String, trim: true },
    coverLetter: { type: String, trim: true, maxlength: 8000, default: '' },
    answers: { type: [answerSchema], default: [] },
    stage: { type: String, enum: APPLICATION_STAGES, default: 'applied', index: true },
    status: { type: String, enum: APPLICATION_STATUSES, default: 'active', index: true },
    tags: { type: [String], default: [] },
    notes: { type: [noteSchema], default: [] },
    score: { type: Number, min: 0, max: 5, default: null },
  },
  { timestamps: true }
);

// One application per candidate per job.
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });
// Pipeline board queries.
applicationSchema.index({ job: 1, stage: 1, createdAt: -1 });
// Candidate dashboard.
applicationSchema.index({ candidate: 1, createdAt: -1 });

applicationSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const Application = mongoose.model('Application', applicationSchema);
