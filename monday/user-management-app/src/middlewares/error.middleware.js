/**
 * src/middlewares/error.middleware.js
 * ---------------------------------------------------------------------------
 * The last two middlewares in the chain.
 *
 * `notFound` runs when no route matched at all.
 * `errorHandler` has FOUR arguments — that is how Express recognises an error
 * handler. Drop the `next` parameter and it silently becomes a normal
 * middleware that never fires. This trips up everyone once.
 */

const { sendError } = require('../utils/response');

function notFound(req, res) {
  return sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[error]', err.stack || err.message);

  // Thrown by express.json() when the body is not valid JSON.
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 400, 'Request body is not valid JSON.');
  }

  return sendError(res, err.status || 500, err.message || 'Internal server error.');
}

module.exports = { notFound, errorHandler };
