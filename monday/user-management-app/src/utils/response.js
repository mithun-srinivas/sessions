/**
 * src/utils/response.js
 * ---------------------------------------------------------------------------
 * The "V" of MVC for a JSON API.
 *
 * A JSON API has no HTML templates, so the *view* is the shape of the JSON we
 * send back. Keeping that shape in one place means every endpoint in the app
 * answers in the same format, and the front-end never has to special-case us.
 *
 * Every response looks like:
 *   { success: boolean, message: string, data?: any, errors?: any }
 */

function sendSuccess(res, statusCode, message, data) {
  const body = { success: true, message };
  if (data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
}

function sendError(res, statusCode, message, errors) {
  const body = { success: false, message };
  if (errors !== undefined) body.errors = errors;
  return res.status(statusCode).json(body);
}

module.exports = { sendSuccess, sendError };
