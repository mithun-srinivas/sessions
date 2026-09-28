/**
 * src/middlewares/auth.middleware.js
 * ---------------------------------------------------------------------------
 * THE AUTH MIDDLEWARE — the star of this session.
 *
 * A middleware is just a function with the signature (req, res, next) that sits
 * between the route and the controller. It can do one of three things:
 *
 *   1. call next()            -> let the request continue to the controller
 *   2. send a response        -> stop the chain; the controller NEVER runs
 *   3. call next(someError)   -> jump straight to the error handler
 *
 * -------------------------------------------------------------------------
 * TEACHING NOTE — read this to the class.
 *
 * `isLoggedIn` below is a single module-level variable shared by the whole
 * server. If one person logs in, EVERYBODY is logged in, and the value resets
 * when the process restarts. It also breaks REST's "stateless" constraint,
 * because the server is remembering something between requests.
 *
 * That is deliberate. It lets us see the *mechanism* of middleware without the
 * noise of JWTs, bcrypt and session stores. When we swap in real tokens later,
 * only the body of `checkLoggedIn` changes — the routes, controllers and model
 * stay exactly as they are. That is the payoff of good layering.
 * -------------------------------------------------------------------------
 */

const { sendError } = require('../utils/response');

// Our pretend session. Starts logged OUT so the 401 is the first thing you see.
let isLoggedIn = false;

/**
 * The guard itself. Put this in front of any route that needs a logged-in user.
 */
function checkLoggedIn(req, res, next) {
  if (!isLoggedIn) {
    // NOTE the `return`. Without it, execution would fall through to next()
    // and Express would try to send a second response for the same request
    // ("Cannot set headers after they are sent to the client").
    //
    // 401 = "I don't know who you are."  (403 would be "I know you, but no.")
    return sendError(
      res,
      401,
      'Unauthorized. You must be logged in to access this resource. ' +
        'Call POST /api/auth/login first.'
    );
  }

  // Handy for the controller / logger downstream. Middleware is allowed to
  // attach things to `req` for later layers to read.
  req.isLoggedIn = true;

  next(); // hand control to the next function in the chain
}

/* -------------------------------------------------------------------------
 * Tiny session API used by the auth controller.
 * ---------------------------------------------------------------------- */

function login() {
  isLoggedIn = true;
  return isLoggedIn;
}

function logout() {
  isLoggedIn = false;
  return isLoggedIn;
}

function getLoginStatus() {
  return isLoggedIn;
}

module.exports = { checkLoggedIn, login, logout, getLoginStatus };
