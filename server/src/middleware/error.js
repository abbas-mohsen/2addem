import multer from 'multer';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

function normalize(error) {
  if (error instanceof ApiError) return error;

  if (error instanceof mongoose.Error.ValidationError) {
    return ApiError.badRequest('Validation failed', {
      code: 'VALIDATION_ERROR',
      details: Object.values(error.errors).map((e) => ({ field: e.path, message: e.message })),
    });
  }

  if (error instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for ${error.path}`, { code: 'INVALID_ID' });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern ?? {}).join(', ') || 'field';
    return ApiError.conflict(`A record with this ${field} already exists`, {
      code: 'DUPLICATE_KEY',
    });
  }

  if (error instanceof multer.MulterError) {
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? `File is larger than the ${env.MAX_UPLOAD_MB}MB limit`
        : 'File upload failed';
    return ApiError.badRequest(message, { code: error.code });
  }

  return new ApiError(500, 'Something went wrong on our side');
}

// eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity.
export function errorHandler(error, req, res, _next) {
  const apiError = normalize(error);

  if (apiError.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${error.stack ?? error.message}`);
  }

  const body = {
    success: false,
    error: {
      message: apiError.message,
      ...(apiError.code ? { code: apiError.code } : {}),
      ...(apiError.details ? { details: apiError.details } : {}),
    },
  };

  // Stack traces are a development aid only — never ship them to clients.
  if (!env.isProduction && apiError.statusCode >= 500) {
    body.error.stack = error.stack;
  }

  res.status(apiError.statusCode).json(body);
}
