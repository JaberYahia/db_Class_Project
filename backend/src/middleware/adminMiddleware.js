// ─────────────────────────────────────────────────────────────────────────────
// middleware/adminMiddleware.js — Role check for admin-only routes
//
// MUST be used AFTER authMiddleware (which populates req.user).
// authMiddleware handles authentication (are you logged in?).
// adminMiddleware handles authorization (are you an admin?).
//
// Usage in a route file:
//   router.use(authMiddleware);
//   router.use(adminMiddleware);  // ← add this line
// ─────────────────────────────────────────────────────────────────────────────

function adminMiddleware(req, res, next) {
  // req.user is set by authMiddleware. role is included in the JWT payload.
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next(); // User is an admin — pass control to the route handler
}

module.exports = adminMiddleware;
