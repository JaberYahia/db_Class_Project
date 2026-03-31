// ─────────────────────────────────────────────────────────────────────────────
// middleware/authMiddleware.js — JWT authentication middleware
//
// How JWT auth works in this app:
//   1. User logs in → server signs a JWT token with a secret key
//   2. Client stores the token in localStorage
//   3. Client sends the token in every request header: Authorization: Bearer <token>
//   4. This middleware reads that header, verifies the token, and attaches the
//      decoded user object to req.user so route handlers know who is asking
// ─────────────────────────────────────────────────────────────────────────────

const jwt = require('jsonwebtoken');

// ─── Required Auth ────────────────────────────────────────────────────────────
// Use this on any route that must be logged in (ratings, recommendations).
// Blocks the request with 401/403 if no valid token is present.

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization']; // e.g. "Bearer eyJhbGci..."
  const token = authHeader && authHeader.split(' ')[1]; // Extract just the token part after "Bearer "

  // No token at all — user is not authenticated
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // Verify the token signature using our secret key.
    // If the token was tampered with or has expired, jwt.verify() throws.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach { id, username, email } to the request object
    next();             // Pass control to the actual route handler
  } catch (err) {
    // Token was invalid or expired
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

// ─── Optional Auth ────────────────────────────────────────────────────────────
// Use this on routes that work for both guests and logged-in users.
// If a valid token is present it attaches req.user; if not, it just continues.
// Example: movie detail page — guests can view, logged-in users see their rating.

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET); // Attach user if token is valid
    } catch {
      // Invalid token — just ignore it and treat the request as anonymous
    }
  }
  next(); // Always continue, even if no token was found
}

module.exports = authMiddleware;
module.exports.optionalAuth = optionalAuth;
