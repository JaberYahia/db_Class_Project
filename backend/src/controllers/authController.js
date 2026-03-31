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

// POST /api/auth/signup
// Creates a new user account and returns a JWT token so they're logged in immediately.
async function signup(req, res) {
  try {
    const { username, email, password } = req.body; // Extract fields from the request body

    // Basic validation — make sure all three fields were sent
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, and password are required.' });
    }

    // Delegate to the service for hashing, duplicate checks, and token generation
    const result = await authService.signup({ username, email, password });

    res.status(201).json(result); // 201 Created — return { user, token }
  } catch (err) {
    // authService throws descriptive errors (e.g. "Email already in use.")
    res.status(400).json({ error: err.message });
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

    res.json(result); // 200 OK — return { user, token }
  } catch (err) {
    // 401 Unauthorized — wrong credentials
    res.status(401).json({ error: err.message });
  }
}

module.exports = { signup, login };
