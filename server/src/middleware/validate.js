import { ApiError } from '../utils/ApiError.js';

/* Replaces req.body/query/params with the parsed (and coerced) result so
   handlers work with validated data only. */
export const validate = (schemas) => (req, _res, next) => {
  for (const source of ['body', 'query', 'params']) {
    const schema = schemas[source];
    if (!schema) continue;

    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(
        ApiError.badRequest('Validation failed', {
          code: 'VALIDATION_ERROR',
          details: result.error.issues.map((issue) => ({
            field: issue.path.join('.') || source,
            message: issue.message,
          })),
        })
      );
      return;
    }

    // Express 5 exposes req.query via a getter, so assign to a shadow property.
    if (source === 'query') {
      Object.defineProperty(req, 'query', { value: result.data, writable: true });
    } else {
      req[source] = result.data;
    }
  }

  next();
};
