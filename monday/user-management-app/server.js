/**
 * server.js
 * ---------------------------------------------------------------------------
 * Entry point. Its only job is to take the configured app and listen on a port.
 *
 *   npm start     -> node server.js
 *   npm run dev   -> node --watch server.js  (restarts on save)
 */

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('');
  console.log('  User Management API (Express + MVC)');
  console.log(`  Listening on http://localhost:${PORT}`);
  console.log('');
  console.log('  Open routes      : /api/users');
  console.log('  Protected routes : /api/secure/users   (401 until you log in)');
  console.log('  Login            : POST /api/auth/login');
  console.log('');
});
