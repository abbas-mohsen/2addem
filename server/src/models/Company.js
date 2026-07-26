import mongoose from 'mongoose';

export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    logoUrl: { type: String, trim: true },
    website: { type: String, trim: true },
    description: { type: String, trim: true, maxlength: 6000 },
    location: { type: String, trim: true, maxlength: 120 },
    industry: { type: String, trim: true, maxlength: 120 },
    size: { type: String, enum: COMPANY_SIZES, default: '1-10' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

companySchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const Company = mongoose.model('Company', companySchema);
