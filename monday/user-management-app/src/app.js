/**
 * src/app.js
 * ---------------------------------------------------------------------------
 * Builds and configures the Express application.
 *
 * Kept separate from server.js so the app can be imported by tests without a
 * port ever being opened. `app.js` = "what the API is". `server.js` = "run it".
 *
 * ORDER MATTERS. Express runs middleware top to bottom:
 *   1. body parsers   (so req.body exists by the time routes run)
 *   2. request logger
 *   3. routes
 *   4. 404 handler    (nothing matched)
 *   5. error handler  (must be last, and must take 4 arguments)
 */

const express = require('express');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error.middleware');
const { getLoginStatus } = require('./middlewares/auth.middleware');

const app = express();

/* 1. Body parsers — application-level middleware, runs for every request. */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* 2. A tiny logger, so students can watch the chain execute in the terminal. */
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    console.log(
      `${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - startedAt}ms)`
    );
  });
  next();
});

/* A friendly index so `GET /` is not a 404 during the demo. */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'User Management API — Express MVC demo',
    isLoggedIn: getLoginStatus(),
    endpoints: {
      auth: {
        'POST /api/auth/login': 'set isLoggedIn = true',
        'POST /api/auth/logout': 'set isLoggedIn = false',
        'GET  /api/auth/status': 'read isLoggedIn',
      },
      open: {
        'POST   /api/users': 'create user',
        'GET    /api/users': 'list users',
        'GET    /api/users/:id': 'read user',
        'PUT    /api/users/:id': 'update user',
        'DELETE /api/users/:id': 'delete user',
      },
      protected: {
        'POST   /api/secure/users': 'create user (login required)',
        'GET    /api/secure/users': 'list users (login required)',
        'GET    /api/secure/users/:id': 'read user (login required)',
        'PUT    /api/secure/users/:id': 'update user (login required)',
        'DELETE /api/secure/users/:id': 'delete user (login required)',
      },
    },
  });
});

/* 3. All API routes live under /api. */
app.use('/api', routes);

/* 4 & 5. Always last. */
app.use(notFound);
app.use(errorHandler);

module.exports = app;
