/* Wraps async route handlers so rejected promises reach the central error
   middleware instead of hanging the request. */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
