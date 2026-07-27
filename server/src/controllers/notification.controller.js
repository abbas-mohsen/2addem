import { asyncHandler } from '../utils/asyncHandler.js';
import { sendData } from '../utils/respond.js';
import { ApiError } from '../utils/ApiError.js';
import {
  listNotifications,
  markAllRead,
  markRead,
} from '../services/notification.service.js';

export const list = asyncHandler(async (req, res) => {
  const { unreadOnly, limit } = req.query;

  sendData(res, await listNotifications({ userId: req.user._id, unreadOnly, limit }));
});

export const read = asyncHandler(async (req, res) => {
  const notification = await markRead(req.user._id, req.params.id);
  if (!notification) throw ApiError.notFound('Notification not found');

  sendData(res, { notification });
});

export const readAll = asyncHandler(async (req, res) => {
  const result = await markAllRead(req.user._id);

  sendData(res, { updated: result.modifiedCount ?? 0 });
});
