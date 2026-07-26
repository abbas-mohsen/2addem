import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendData } from '../utils/respond.js';
import { authenticate, loadSessionUser, registerUser } from '../services/auth.service.js';
import {
  REFRESH_COOKIE_NAME,
  clearRefreshCookie,
  setRefreshCookie,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../services/token.service.js';

async function issueSession(res, user, statusCode = 200) {
  setRefreshCookie(res, signRefreshToken(user));
  const sessionUser = await loadSessionUser(user._id);
  return sendData(res, { user: sessionUser, accessToken: signAccessToken(user) }, statusCode);
}

export const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);
  await issueSession(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const user = await authenticate(req.body);
  await issueSession(res, user);
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) throw ApiError.unauthorized('No active session');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Session expired, please sign in again');
  }

  const user = await User.findById(payload.sub);
  // A bumped tokenVersion means the user logged out everywhere.
  if (!user || !user.isActive || (user.tokenVersion ?? 0) !== payload.version) {
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Session is no longer valid');
  }

  await issueSession(res, user);
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await User.updateOne({ _id: payload.sub }, { $inc: { tokenVersion: 1 } });
    } catch {
      // An unreadable cookie is already useless; clearing it is enough.
    }
  }

  clearRefreshCookie(res);
  sendData(res, { message: 'Signed out' });
});

export const me = asyncHandler(async (req, res) => {
  sendData(res, { user: await loadSessionUser(req.user._id) });
});

export const updateMe = asyncHandler(async (req, res) => {
  const { name, avatarUrl, profile } = req.body;
  const user = req.user;

  if (name !== undefined) user.name = name;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  if (profile) {
    user.profile = { ...user.profile.toObject(), ...profile };
  }

  await user.save();
  sendData(res, { user: await loadSessionUser(user._id) });
});
