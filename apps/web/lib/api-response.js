/**
 * @param {unknown} data
 * @param {object} [meta]
 * @returns {Response}
 */
export function jsonResponse(data, meta = {}) {
  return Response.json({
    data,
    meta,
    error: null,
  });
}

/**
 * @param {string} message
 * @param {number} [status]
 * @returns {Response}
 */
export function errorResponse(message, status = 500) {
  return Response.json(
    { data: null, meta: {}, error: message },
    { status }
  );
}
