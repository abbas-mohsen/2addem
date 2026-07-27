import mongoose from 'mongoose';

export const INTERVIEW_LOCATION_TYPES = ['video', 'phone', 'onsite'];
export const INTERVIEW_STATUSES = ['scheduled', 'completed', 'cancelled'];

const interviewSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true,
    },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    // Denormalised so ownership checks and candidate queries avoid a join.
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    scheduledFor: { type: Date, required: true, index: true },
    durationMins: { type: Number, min: 5, max: 480, default: 45 },
    locationType: { type: String, enum: INTERVIEW_LOCATION_TYPES, default: 'video' },
    // A meeting link for video, a number for phone, an address for onsite.
    location: { type: String, trim: true, maxlength: 500, default: '' },
    interviewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    notes: { type: String, trim: true, maxlength: 4000, default: '' },
    status: { type: String, enum: INTERVIEW_STATUSES, default: 'scheduled', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Candidate dashboard: my upcoming interviews, soonest first.
interviewSchema.index({ candidate: 1, scheduledFor: 1 });

interviewSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const Interview = mongoose.model('Interview', interviewSchema);
