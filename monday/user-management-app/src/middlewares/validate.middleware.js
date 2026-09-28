/**
 * src/middlewares/validate.middleware.js
 * ---------------------------------------------------------------------------
 * Validation middleware.
 *
 * Validation is put in front of the route rather than inside the controller so
 * that the controller can assume it received sane data. It also means the same
 * rules are applied identically to the open routes and the secure routes —
 * write it once, use it everywhere.
 */

const { sendError } = require('../utils/response');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POST /users — name and email are mandatory. */
function validateCreateUser(req, res, next) {
  const errors = [];
  const { name, email, age } = req.body || {};

  if (typeof name !== 'string' || name.trim().length < 2) {
    errors.push('`name` is required and must be at least 2 characters.');
  }
  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email)) {
    errors.push('`email` is required and must be a valid email address.');
  }
  if (age !== undefined && (!Number.isInteger(age) || age < 0 || age > 150)) {
    errors.push('`age`, when supplied, must be a whole number between 0 and 150.');
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  // Normalise before it reaches the controller.
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();

  next();
}

/** PUT /users/:id — every field is optional, but must be valid if present. */
function validateUpdateUser(req, res, next) {
  const errors = [];
  const { name, email, age } = req.body || {};

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    errors.push('`name` must be at least 2 characters.');
  }
  if (email !== undefined && (typeof email !== 'string' || !EMAIL_PATTERN.test(email))) {
    errors.push('`email` must be a valid email address.');
  }
  if (age !== undefined && (!Number.isInteger(age) || age < 0 || age > 150)) {
    errors.push('`age` must be a whole number between 0 and 150.');
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  if (typeof name === 'string') req.body.name = name.trim();
  if (typeof email === 'string') req.body.email = email.trim().toLowerCase();

  next();
}

module.exports = { validateCreateUser, validateUpdateUser };
