// ─────────────────────────────────────────────────────────────────────────────
// routes/ratings.js — Rating endpoints (all require authentication)
//
// Mounted in server.js at /api/ratings. Full paths:
//   POST /api/ratings     → submit or update a rating for a movie
//   GET  /api/ratings/me  → get all ratings for the current logged-in user
//
// router.use(authMiddleware) applies the JWT check to every route in this file
// so we don't have to add it individually to each handler.
// ─────────────────────────────────────────────────────────────────────────────

const express          = require('express');
const ratingController = require('../controllers/ratingController');
const authMiddleware   = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication check to ALL routes in this file
// Any request without a valid JWT token will be rejected with 401
router.use(authMiddleware);

router.post('/',   ratingController.submitRating); // Submit or update a rating
router.get('/me',  ratingController.getMyRatings); // Get the current user's rating history

module.exports = router;
