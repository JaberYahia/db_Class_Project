// ─────────────────────────────────────────────────────────────────────────────
// controllers/authController.js — HTTP handlers for authentication routes
//
// Controllers are the bridge between the HTTP layer (Express) and the service
// layer (business logic). They handle:
//   • Reading data from the request (req.body, req.params)
//   • Calling the appropriate service function
//   • Sending the HTTP response (status code + JSON body)
// ─────────────────────────────────────────────────────────────────────────────

const authService = require('../services/authService');

// Known business-logic error messages thrown intentionally by authService.
// These map to 4xx responses. Any other error is an infrastructure failure → 500.
const CLIENT_ERRORS = new Set([
  'Email already in use.',
  'Username already taken.',
  'Invalid email or password.',
]);

// POST /api/auth/signup
// Creates a new user account and returns a JWT token so they're logged in immediately.
async function signup(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, and password are required.' });
    }

    const result = await authService.signup({ username, email, password });
    res.status(201).json(result);
  } catch (err) {
    if (CLIENT_ERRORS.has(err.message)) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error.' });
  }
}

// POST /api/auth/login
// Verifies credentials and returns a JWT token on success.
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required.' });
    }

    const result = await authService.login({ email, password });
    res.json(result);
  } catch (err) {
    if (CLIENT_ERRORS.has(err.message)) {
      return res.status(401).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { signup, login };
