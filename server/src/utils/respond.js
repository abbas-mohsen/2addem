/* Every successful response uses the same envelope: { success, data, meta? }.
   Errors use { success: false, error: { message, code?, details? } }. */

export function sendData(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

export function sendList(res, items, meta, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data: items, meta });
}

export function buildPageMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasNextPage: page * limit < total,
  };
}
