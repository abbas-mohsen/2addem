import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const USER_ROLES = ['candidate', 'recruiter', 'admin'];

const profileSchema = new mongoose.Schema(
  {
    headline: { type: String, trim: true, maxlength: 160 },
    bio: { type: String, trim: true, maxlength: 4000 },
    location: { type: String, trim: true, maxlength: 120 },
    // Stored as entered; the client suggests +961 but does not force it, since
    // candidates applying from the diaspora have foreign numbers.
    phone: { type: String, trim: true, maxlength: 32 },
    skills: { type: [String], default: [] },
    experienceYears: { type: Number, min: 0, max: 60 },
    resumeUrl: { type: String, trim: true },
    links: {
      website: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      github: { type: String, trim: true },
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: 'candidate', index: true },
    avatarUrl: { type: String, trim: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
    profile: { type: profileSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
    // Bumped on logout / password change so previously issued refresh tokens stop working.
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function setPassword(plainPassword) {
  this.passwordHash = await bcrypt.hash(plainPassword, 12);
};

userSchema.methods.verifyPassword = function verifyPassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.tokenVersion;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
