// ─────────────────────────────────────────────────────────────────────────────
// routes/auth.js — Authentication endpoints
//
// These routes are public — no login token required.
// Mounted in server.js at /api/auth, so full paths are:
//   POST /api/auth/signup
//   POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────

const express        = require('express');
const authController = require('../controllers/authController');

const router = express.Router(); // Create a mini Express app for just these routes

router.post('/signup', authController.signup); // Register a new account
router.post('/login',  authController.login);  // Log in with email + password

module.exports = router;
