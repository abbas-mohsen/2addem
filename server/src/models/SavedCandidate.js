import mongoose from 'mongoose';

/* A company's talent pool: people worth remembering after a role closes. */
const savedCandidateSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    savedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // The application that prompted the save, when there was one.
    sourceApplication: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', default: null },
    note: { type: String, trim: true, maxlength: 2000, default: '' },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

// A candidate appears in a company's pool at most once.
savedCandidateSchema.index({ company: 1, candidate: 1 }, { unique: true });

savedCandidateSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const SavedCandidate = mongoose.model('SavedCandidate', savedCandidateSchema);
