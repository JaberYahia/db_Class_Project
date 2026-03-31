// ─────────────────────────────────────────────────────────────────────────────
// routes/recommendations.js — Recommendation endpoint (requires authentication)
//
// Mounted in server.js at /api/recommendations. Full path:
//   GET /api/recommendations → personalised movie picks for the logged-in user
//
// Authentication is required because the algorithm is personalized —
// we need to know which user is asking in order to compare their ratings
// against other users and generate relevant suggestions.
// ─────────────────────────────────────────────────────────────────────────────

const express                  = require('express');
const recommendationController = require('../controllers/recommendationController');
const authMiddleware           = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes in this file with JWT authentication
router.use(authMiddleware);

router.get('/', recommendationController.getRecommendations);

module.exports = router;
