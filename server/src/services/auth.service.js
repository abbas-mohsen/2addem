import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { ApiError } from '../utils/ApiError.js';
import { uniqueSlug } from '../utils/slug.js';

export async function registerUser({ name, email, password, role, companyName }) {
  const existing = await User.exists({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const user = new User({ name, email, role });
  await user.setPassword(password);

  if (role === 'recruiter') {
    const slug = await uniqueSlug(companyName, async (candidate) =>
      Boolean(await Company.exists({ slug: candidate }))
    );
    const company = await Company.create({ name: companyName, slug, createdBy: user._id });
    user.company = company._id;
  }

  await user.save();
  return user;
}

export async function authenticate({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  // Same message either way so the endpoint cannot be used to enumerate accounts.
  if (!user || !(await user.verifyPassword(password))) {
    throw ApiError.unauthorized('Incorrect email or password');
  }
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

  return user;
}

export async function loadSessionUser(userId) {
  if (!mongoose.isValidObjectId(userId)) throw ApiError.unauthorized();

  const user = await User.findById(userId).populate('company', 'name slug logoUrl');
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

  return user;
}
