/**
 * src/controllers/auth.controller.js
 * ---------------------------------------------------------------------------
 * Flips the `isLoggedIn` switch so the class can watch the middleware work.
 *
 * There is no password here on purpose — today's lesson is middleware, not
 * authentication. Real credential checking (bcrypt, JWT) comes next session.
 */

const { login, logout, getLoginStatus } = require('../middlewares/auth.middleware');
const { sendSuccess } = require('../utils/response');

function loginUser(req, res) {
  const isLoggedIn = login();
  return sendSuccess(res, 200, 'Logged in. Protected routes are now available.', {
    isLoggedIn,
  });
}

function logoutUser(req, res) {
  const isLoggedIn = logout();
  return sendSuccess(res, 200, 'Logged out. Protected routes will now return 401.', {
    isLoggedIn,
  });
}

function status(req, res) {
  return sendSuccess(res, 200, 'Current session status.', {
    isLoggedIn: getLoginStatus(),
  });
}

module.exports = { loginUser, logoutUser, status };
