// ─────────────────────────────────────────────────────────────────────────────
// middleware/authMiddleware.js — JWT authentication + ban enforcement
//
// How JWT auth works in this app:
//   1. User logs in → server signs a JWT token with a secret key
//   2. Client stores the token in localStorage
//   3. Client sends the token in every request header: Authorization: Bearer <token>
//   4. This middleware reads that header, verifies the token, checks for active
//      bans, and attaches the decoded user to req.user
// ─────────────────────────────────────────────────────────────────────────────

const jwt           = require('jsonwebtoken');
const { getActiveBan } = require('../repositories/adminRepo');

// ─── Required Auth ────────────────────────────────────────────────────────────
// Use this on any route that must be logged in (ratings, recommendations, admin).
// Blocks the request with 401/403 if no valid token is present, or if the user
// has an active ban.

async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization']; // e.g. "Bearer eyJhbGci..."
  const token = authHeader && authHeader.split(' ')[1]; // Extract the token after "Bearer "

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  // Step 1: Verify the JWT signature and expiry
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET); // throws if invalid or expired
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }

  // Step 2: Check if the user has an active ban before letting them through.
  // If the DB is unavailable, we fail open (let the request through) rather than
  // locking out all users whenever the DB hiccups.
  try {
    const ban = await getActiveBan(decoded.id);
    if (ban) {
      const message = ban.type === 'timeout'
        ? 'Your account is temporarily suspended.'
        : 'Your account has been permanently banned.';
      return res.status(403).json({ error: message, reason: ban.reason || null });
    }
  } catch {
    // Ban check failed (DB error) — proceed without blocking
  }

  req.user = decoded; // Attach { id, username, email, role } to the request
  next();
}

// ─── Optional Auth ────────────────────────────────────────────────────────────
// Use this on routes that work for both guests and logged-in users.
// Does NOT check bans — banned users can still view public content (movies, etc.)
// but cannot rate or review (those routes use required authMiddleware).

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // Invalid token — treat the request as anonymous
    }
  }
  next();
}

module.exports = authMiddleware;
module.exports.optionalAuth = optionalAuth;
