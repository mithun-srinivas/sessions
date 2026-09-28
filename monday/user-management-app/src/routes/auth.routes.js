/**
 * src/routes/auth.routes.js
 * ---------------------------------------------------------------------------
 * Mounted at /api/auth — the switch that drives the classroom demo.
 *
 *   POST /api/auth/login   -> isLoggedIn = true
 *   POST /api/auth/logout  -> isLoggedIn = false
 *   GET  /api/auth/status  -> current value
 */

const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.post('/login', authController.loginUser);
router.post('/logout', authController.logoutUser);
router.get('/status', authController.status);

module.exports = router;
