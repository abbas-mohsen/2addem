import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../services/token.service.js';

function readBearerToken(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

async function resolveUser(token) {
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized('Session expired, please sign in again', {
      code: 'TOKEN_INVALID',
    });
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

  return user;
}

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = readBearerToken(req);
  if (!token) throw ApiError.unauthorized();

  req.user = await resolveUser(token);
  next();
});

/* Public endpoints that behave slightly differently for signed-in users
   (e.g. telling a candidate they already applied) use this. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = readBearerToken(req);
  if (token) {
    try {
      req.user = await resolveUser(token);
    } catch {
      req.user = undefined;
    }
  }
  next();
});

export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`This action requires the ${roles.join(' or ')} role`));
    }
    next();
  };

/* Recruiters act on behalf of a company; without one they cannot own anything. */
export const requireCompany = (req, _res, next) => {
  if (!req.user?.company) {
    return next(
      ApiError.badRequest('Create your company profile before managing jobs', {
        code: 'COMPANY_REQUIRED',
      })
    );
  }
  next();
};
