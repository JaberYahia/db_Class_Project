// ─────────────────────────────────────────────────────────────────────────────
// routes/admin.js — Admin moderation endpoints
//
// Mounted in server.js at /api/admin. Full paths:
//   GET    /api/admin/reviews          → all reviews (dashboard overview)
//   DELETE /api/admin/reviews/:id      → delete any review
//   GET    /api/admin/users            → all users + ban status
//   POST   /api/admin/ban/:userId      → issue ban or timeout
//   DELETE /api/admin/ban/:userId      → lift a ban
//
// All routes require: 1) a valid JWT (authMiddleware) and 2) admin role (adminMiddleware).
// Non-admins receive 403 before any controller logic runs.
// ─────────────────────────────────────────────────────────────────────────────

const express         = require('express');
const authMiddleware  = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Apply both guards to every route in this file
router.use(authMiddleware);  // Must be logged in
router.use(adminMiddleware); // Must have role === 'admin'

router.get('/reviews',              adminController.getAllReviews); // Overview table
router.delete('/reviews/:reviewId', adminController.deleteReview); // Moderate a review
router.get('/users',                adminController.getAllUsers);   // User management
router.post('/ban/:userId',         adminController.banUser);      // Ban or timeout
router.delete('/ban/:userId',       adminController.unbanUser);    // Lift a ban

module.exports = router;
