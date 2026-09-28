/**
 * src/routes/index.js
 * ---------------------------------------------------------------------------
 * One place that mounts every route group, so app.js stays tidy and you can
 * see the whole URL surface of the API at a glance.
 */

const express = require('express');
const userRoutes = require('./user.routes');
const secureRoutes = require('./secure.routes');
const authRoutes = require('./auth.routes');

const router = express.Router();

router.use('/auth', authRoutes);           // /api/auth/...
router.use('/users', userRoutes);          // /api/users/...        (open)
router.use('/secure/users', secureRoutes); // /api/secure/users/... (protected)

module.exports = router;
